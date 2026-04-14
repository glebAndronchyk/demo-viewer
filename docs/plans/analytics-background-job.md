# Plan: Analytics Background Job via Worker Threads

## Context

Two calculators already exist (`MatchPlayerStatsCalculator`, `MatchAccuracyCalculator`) but are never called. The goal is to wire them into a background job triggered after demo parsing completes. Calculation is DB-intensive (multiple MongoDB aggregation pipelines per player), so it runs in a Bun worker thread to keep the main event loop free. The existing `ComputeResourcesQueueService` wraps the worker lifetime so resource pressure (CPU slots + RSS memory) is respected.

Wave 1 and Wave 2 are separate commands. Each wave hardcodes the calculators it runs — no generics, no registry. Adding calculators to a wave = edit the handler. Adding a new wave = new command + new handler.

---

## Architecture Decision: Worker Thread with Full DI

The worker boots its own full DI stack — same pattern as `backend/api/src/index.ts` — using `process.env` directly (Bun workers inherit it from the parent).

```
Main thread                            Worker thread
───────────────────────────────        ──────────────────────────────────────
queue.enqueue(async () => {            self.onmessage({ command })
  const [w1, w2] = await Promise.all(  new EnvConfiguration()
    workerService.runWave1(cmd),    →   await DatabaseService.connect(config)
    workerService.runWave2(cmd),        build full DI (CommandBusService)
  )                                     switch command.type:
  // linking step                         wave1 → run PlayerStats + Accuracy
})                                        wave2 → run ... (future)
                                      self.postMessage({ result })
```

---

## Wave Design

Both waves run inside **one queue slot** via `Promise.all`. After both resolve, a linking step saves results atomically (stats first → accuracy uses returned `statsId`).

```typescript
void outbound.queue.enqueue(async () => {
  const [wave1Results, wave2Results] = await Promise.all([
    outbound.analyticsWorkerRepository.runWave1({ matchId, participantSteamIds }),
    outbound.analyticsWorkerRepository.runWave2({ matchId, participantSteamIds }),
  ]);

  // linking step — atomic save per player
  for (const { steamId, stats, accuracy } of wave1Results) {
    const statsId = await outbound.playerStatsRepository.save(stats);
    if (accuracy) {
      await outbound.playerAccuracyRepository.save({ ...accuracy, statsId });
    }
  }
  // wave2 linking step (future)
});
```

### Wave 1 Calculators
- `MatchPlayerStatsCalculator` → `PlayerStatsEntity`
- `MatchAccuracyCalculator` → `Omit<PlayerAccuracyEntity, 'statsId'>`

Returns per player: `{ steamId, stats: PlayerStatsEntity, accuracy: Omit<PlayerAccuracyEntity, 'statsId'> }[]`

### Wave 2 Calculators
- Reserved (e.g. `MatchClutchCalculator`)
- Returns `{}[]` initially — handler is a stub

---

## Commands

**`ComputeMatchAnalyticsWave1Command`**
```typescript
interface ComputeMatchAnalyticsWave1Command {
  type: "compute_match_analytics_wave1";
  matchId: string;
  participantSteamIds: string[];
}
// result: { steamId: string; stats: PlayerStatsEntity; accuracy: Omit<PlayerAccuracyEntity, 'statsId'> }[]
```

**`ComputeMatchAnalyticsWave2Command`**
```typescript
interface ComputeMatchAnalyticsWave2Command {
  type: "compute_match_analytics_wave2";
  matchId: string;
  participantSteamIds: string[];
}
// result: {}[] (stub for now)
```

---

## Files to Create / Modify

### Database layer — `backend/database/src/`
- **CREATE** `types/player_accuracy.types.ts` — `IPlayerAccuracy`, `IPlayerAccuracyDocument`
- **CREATE** `schemas/player_accuracy.schema.ts` — fields: `stats_id` (String, required), `total_shots`, `total_hits`, `headshots`, `top_level_accuracy` (Decimal128), `hit_breakdown` (Mixed), `date_recorded`. Collection: `player_accuracy`. Index on `stats_id`.
- **CREATE** `models/player_accuracy.model.ts` — `PlayerAccuracyModel` (same pattern as `player_stats.model.ts`)
- **MODIFY** `backend/database/src/index.ts` — export all three new files

### Domain ports — `backend/domain/src/ports/outbound/`
- **CREATE** `PlayerStatsOutboundPort.ts`
  ```typescript
  interface PlayerStatsOutboundPort {
    save(stats: PlayerStatsEntity): Promise<string>; // returns _id
  }
  ```
- **CREATE** `PlayerAccuracyOutboundPort.ts`
  ```typescript
  interface PlayerAccuracyOutboundPort {
    save(accuracy: PlayerAccuracyEntity): Promise<void>;
  }
  ```
- **CREATE** `AnalyticsWorkerOutboundPort.ts`
  ```typescript
  interface AnalyticsWorkerOutboundPort {
    runWave1(cmd: ComputeMatchAnalyticsWave1Command): Promise<Wave1Result[]>;
    runWave2(cmd: ComputeMatchAnalyticsWave2Command): Promise<Wave2Result[]>;
  }
  ```

### Domain types
- **MODIFY** `backend/domain/src/types/DomainOutbound.ts` — add `playerStatsRepository`, `playerAccuracyRepository`, `analyticsWorkerRepository`

### Domain commands — `backend/domain/src/commands/`
- **CREATE** `ComputeMatchAnalyticsWave1Command.ts`
- **CREATE** `ComputeMatchAnalyticsWave2Command.ts`

### Domain handlers — `backend/domain/src/handlers/`
- **CREATE** `ComputeMatchAnalyticsWave1CommandHandler.ts`
  - Iterates `participantSteamIds`, runs `MatchPlayerStatsCalculator` + `MatchAccuracyCalculator` per player via `Promise.all`
  - Returns `{ steamId, stats, accuracy }[]`
  - Per-player errors caught and logged; continues to next player
- **CREATE** `ComputeMatchAnalyticsWave2CommandHandler.ts` — stub, returns `[]`
- **MODIFY** `backend/domain/src/handlers/index.ts` — export both new registrations

### Api layer: repositories — `backend/api/src/repository/`
- **CREATE** `PlayerStatsRepository.ts` — implements `PlayerStatsOutboundPort`, uses `DatabaseService.PlayerStatsModel`, upsert by `(participant_steam_id, match_id)`, returns `String(doc._id)`
- **CREATE** `PlayerAccuracyRepository.ts` — implements `PlayerAccuracyOutboundPort`, uses `DatabaseService.PlayerAccuracyModel`, upsert by `stats_id`

### Api layer: mappers — `backend/api/src/mappers/`
- **CREATE** `player-accuracy.mapper.ts` — `IPlayerAccuracyDocument` → `PlayerAccuracyEntity`, handles `Decimal128` → `parseFloat`, `hit_breakdown` Mixed → `Record<HitGroup, number>`

### Api layer: DatabaseService
- **MODIFY** `backend/api/src/adapters/DatabaseService.ts` — add `get PlayerAccuracyModel()` and import `PlayerAccuracyModel` from `@demo-viewer/database`

### Api layer: worker file
- **CREATE** `backend/api/src/workers/analytics.worker.ts`
  - On startup: `new EnvConfiguration()` → `DatabaseService.connect(config)` → build full DI → construct `CommandBusService`
  - `self.onmessage` receives `{ command }`, dispatches via commandBus, posts back `{ result }`
  - Handles both `compute_match_analytics_wave1` and `compute_match_analytics_wave2`

### Api layer: worker service adapter
- **CREATE** `backend/api/src/adapters/AnalyticsWorkerService.ts` — implements `AnalyticsWorkerOutboundPort`
  - Each method (`runWave1`, `runWave2`) wraps `new Worker(new URL('../workers/analytics.worker.ts', import.meta.url))` in a `Promise`
  - Sends `{ command }` via `postMessage`, resolves on `{ result }`, rejects on `onerror`
  - Terminates worker after completion

### Api layer: wiring
- **MODIFY** `backend/api/src/adapters/CommandBusService.ts` — add `PlayerStatsRepository`, `PlayerAccuracyRepository`, `AnalyticsWorkerService` as constructor params; pass to `domainOperations({...})`
- **MODIFY** `backend/api/src/index.ts` — register new singletons in DI container

### Trigger point
- **MODIFY** `backend/domain/src/handlers/DownloadAndParseDemoCommandHandler.ts`
  - After `queue.enqueue(parse...)` resolves, fetch the parsed match via `matchRepository.findByShareCode(shareCode)`
  - Extract non-bot `steamIds` from `match.participants`
  - `void outbound.queue.enqueue(async () => { Promise.all(wave1, wave2) + linking step })`
  - Handler still returns `{ url }` immediately — analytics is fire-and-forget

---

## Implementation Order

1. Database layer (types → schema → model → index.ts export)
2. Domain ports (3 new outbound ports)
3. `DomainOutbound.ts` update
4. Commands (`Wave1` + `Wave2`)
5. Handlers (`Wave1` + `Wave2` + `handlers/index.ts` update)
6. `player-accuracy.mapper.ts`
7. `PlayerStatsRepository` + `PlayerAccuracyRepository`
8. `DatabaseService` update (`PlayerAccuracyModel` getter)
9. `analytics.worker.ts`
10. `AnalyticsWorkerService.ts`
11. `CommandBusService` + `index.ts` wiring
12. `DownloadAndParseDemoCommandHandler` trigger
13. Migration: `bun run migrate:create` → `bun run migrate:up` (for `player_accuracy` collection indexes)

---

## Verification

```bash
# Type-check everything
bun run type-check

# Run existing tests (must not regress)
bun --filter @demo-viewer/tests test:backend

# Manual end-to-end:
# 1. Trigger downloadAndParseDemo via API
# 2. Watch logs for [Worker] lines from analytics.worker.ts
# 3. Verify DB:
#    db.player_stats.find({ match_id: "<id>" })
#    db.player_accuracy.find({ stats_id: "<stats_id>" })
# 4. Confirm accuracy.stats_id === stats._id for each player
```
