# Plan: Parse Task Queue with Concurrency + Resource Limiting

## Context

The cron job (`CollectMatchesFromUserCron.ts`) has a TODO "think about workers pool" — it will dispatch `download_and_parse_demo` for every user every 5 minutes. Each dispatch spawns a Go child process. With many users, this means unbounded concurrent Go processes, which will exhaust CPU and RAM. Incoming tasks that arrive while the system is saturated need to be queued and drained as capacity frees up.

---

## Approach: In-Process Parse Queue (no external dependencies)

Use Bun's `navigator.hardwareConcurrency` and `process.memoryUsage()` to cap concurrent parse jobs. A simple queue holds pending tasks; a scheduler drains it when capacity allows.

### Capacity Checks

```typescript
// Max parallel parse jobs = half of logical CPU cores (Go is multi-threaded per process)
const MAX_PARALLEL = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));

// Refuse to start new job if RSS > threshold (e.g. 80% of a configurable limit)
const RAM_LIMIT_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB default, env-configurable
function hasRamHeadroom(): boolean {
  return process.memoryUsage.rss() < RAM_LIMIT_BYTES * 0.8;
}
```

### Queue Design

```typescript
type ParseJob = {
  args: ParseArgs;
  resolve: (pid: number) => void;
  reject: (err: Error) => void;
};

let active = 0;
const queue: ParseJob[] = [];

function tryDrain() {
  while (queue.length > 0 && active < MAX_PARALLEL && hasRamHeadroom()) {
    const job = queue.shift()!;
    active++;
    runJob(job);
  }
}

function runJob(job: ParseJob) {
  const child = Bun.spawn([...buildArgs(job.args)], { env: { ...process.env }, stdio: ["inherit", "inherit", "inherit"] });
  job.resolve(child.pid);
  child.exited.then((code) => {
    active--;
    if (code !== 0) { /* log error */ }
    tryDrain();
  }).catch((err) => {
    active--;
    tryDrain();
  });
}

export function enqueueParseJob(args: ParseArgs): Promise<number> {
  return new Promise((resolve, reject) => {
    queue.push({ args, resolve, reject });
    tryDrain();
  });
}
```

- `resolve` fires immediately when the child **starts** (returns PID) — caller gets a response fast.
- `tryDrain()` is called every time a job finishes, picking up the next queued job.
- RAM check gates each new spawn; if RAM is tight, jobs stay queued even if CPU slots are free.

---

## Where Each Change Lives

| File | Change |
|------|--------|
| `backend/demo-composer/index.ts` | Replace bare `parse()` with `enqueueParseJob()` queue implementation |
| `backend/api/src/repository/ParserRepository.ts` | Call `enqueueParseJob()` instead of directly calling `parse()` |
| `backend/api/src/cron/CollectMatchesFromUserCron.ts` | Uncomment the cron logic; replace `Promise.all` with sequential dispatches (queue handles parallelism) |

No new packages. No Redis. No external queue. Pure Bun.

---

## Configuration (env vars)

| Var | Default | Purpose |
|-----|---------|---------|
| `PARSE_MAX_PARALLEL` | `floor(hardwareConcurrency / 2)` | Override CPU-based limit |
| `PARSE_RAM_LIMIT_GB` | `2` | Max RSS before new jobs are held |

---

## Verification

1. Trigger 10+ parse jobs simultaneously via the maintenance endpoint or cron
2. `ps aux | grep main.bin` — confirm at most `MAX_PARALLEL` Go processes running at once
3. Watch RSS via `process.memoryUsage.rss()` logging — confirm no new spawns when above threshold
4. After jobs complete, confirm queued jobs start automatically (drain fires)
5. Check all PIDs are returned immediately to callers (no blocking on queue wait)