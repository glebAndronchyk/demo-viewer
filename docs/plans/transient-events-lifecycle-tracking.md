# Plan: Transient Events — Lifecycle Tracking for Demo Seek

## Context

When jumping to a tick in the demo viewer, the frontend must restore the full visual state — including in-flight events (grenades flying, fires burning, bomb being defused) that started before the target tick and haven't ended yet. These are invisible to the current seek response because events are stored as point-in-time entries with no duration.

**Approach:** No new collection. Patch `ended_at` directly into the `data` map of the existing start event inside `demo_chunks`. During parsing, the Go parser tracks open events in memory and patches their `ended_at` when the terminator fires. Because start events may have already been flushed to MongoDB before the terminator fires (chunk boundary crossing), a second pass after `ParseToEnd()` issues MongoDB `$set` updates for any events that closed after flush.

On the seek side, `includeTransientEvents=true` triggers a configurable look-back query: scan N ticks before `startGameTick`, find start events with `ended_at > startGameTick` (still in flight at the target tick), and return them alongside the frames.

---

## Implementation Plan

### 1 — Go: Add `openTransientEvent` to `types.go`

File: `backend/demo-composer/parser/types.go`

Add one ephemeral struct (never persisted):

```go
type openTransientEvent struct {
    eventType   string
    startedAt   int    // game tick when the event fired
    chunkIndex  int    // which chunk the frame was written into (-1 if still in buffer)
    frameIndex  int    // index within that chunk's Frames slice
    eventIndex  int    // index within frame.Events
    flushed     bool   // true if the chunk has already been sent to MongoDB
}
```

No new MongoDB document type is needed.

---

### 2 — Go: Create `transient_tracker.go` (new file)

File: `backend/demo-composer/parser/transient_tracker.go`

```go
// eventLifecycleMap maps start event type → valid terminator types
var eventLifecycleMap = map[string][]string{
    "grenade_throw":      {"grenade_destroy", "grenade_he_explode", "grenade_flash_explode", "round_end"},
    "grenade_fire_start": {"grenade_fire_end", "round_end"},
    "bomb_planted":       {"bomb_exploded", "bomb_defused", "round_end"},
    "bomb_defuse_start":  {"bomb_defuse_aborted", "bomb_defused", "round_end"},
}

type pendingPatch struct {
    chunkIndex int
    frameIndex int
    eventIndex int
    endedAt    int
}

type transientTracker struct {
    // key = composite string, e.g. "grenade:12345" or "bomb_planted:round_3"
    openEvents    map[string]*openTransientEvent
    pendingPatches []pendingPatch  // for events that were already flushed when terminated
    demoID        string
}
```

Methods:
- `newTransientTracker(demoID string) *transientTracker`
- `onStartEvent(key string, event *openTransientEvent)` — store in `openEvents`
- `onEndEvent(terminatorType string, key string, gameTick int)` — find the open event for this key, check that `terminatorType` is in its lifecycle terminators, then:
  - If `!flushed`: patch `ended_at` directly into the in-memory frames buffer (caller passes a pointer to the event data map)
  - If `flushed`: append to `pendingPatches` for the second-pass MongoDB update
- `onRoundEnd(gameTick int)` — call `onEndEvent("round_end", key, gameTick)` for all open events
- `flushPendingPatches(repo *Repository) error` — issue MongoDB `arrayFilters` updates for all `pendingPatches`

**Key matching:**
- Grenades: key = `"grenade:" + strconv.Itoa(entityID)` (entity ID is unique per projectile)
- Bomb plant: key = `"bomb_planted:round_" + strconv.Itoa(roundNumber)`
- Bomb defuse: key = `"bomb_defuse_start:round_" + strconv.Itoa(roundNumber)`

---

### 3 — Go: Wire tracker into `parser.go`

File: `backend/demo-composer/parser/parser.go`

**Add field to `Parser` struct:**
```go
tracker *transientTracker
```

**Initialize in `NewParser`** — refactor the inline `uuid.New().String()` into a local variable so both `demoID` and `tracker` share it:
```go
demoID := uuid.New().String()
return &Parser{
    demoID:  demoID,
    tracker: newTransientTracker(demoID),
    // ... existing fields
}
```

**Add helper to get current game tick:**
```go
func (p *Parser) currentGameTick() int {
    if len(p.framesBuffer) == 0 {
        return 0
    }
    return p.framesBuffer[len(p.framesBuffer)-1].GameTick
}
```

**Wire in `registerEventHandlers`** — after each `addEventToCurrentFrame(...)` call, register with the tracker. The event data map pointer is the same map that was just embedded in the frame, so patching it in-memory works directly.

| Event | Tracker call |
|-------|-------------|
| `grenade_throw` | `onStartEvent("grenade:"+id, ...)` — mark not flushed, record frame/event position |
| `grenade_destroy` | `onEndEvent("grenade_destroy", "grenade:"+id, tick)` |
| `grenade_he_explode` | `onEndEvent("grenade_he_explode", "grenade:"+id, tick)` |
| `grenade_flash_explode` | `onEndEvent("grenade_flash_explode", "grenade:"+id, tick)` |
| `grenade_fire_start` | `onStartEvent("grenade:"+strconv.Itoa(entityID), ...)` |
| `grenade_fire_end` | `onEndEvent("grenade_fire_end", "grenade:"+..., tick)` |
| `bomb_planted` | `onStartEvent("bomb_planted:round_"+N, ...)` |
| `bomb_exploded` | `onEndEvent("bomb_exploded", "bomb_planted:round_"+N, tick)` |
| `bomb_defused` | `onEndEvent` for both `bomb_planted` and `bomb_defuse_start` keys |
| `bomb_defuse_start` | `onStartEvent("bomb_defuse_start:round_"+N, ...)` |
| `bomb_defuse_aborted` | `onEndEvent("bomb_defuse_aborted", "bomb_defuse_start:round_"+N, tick)` |
| `round_end` | `p.tracker.onRoundEnd(endGameTick)` — call **before** `addEventToCurrentFrame` |

**Mark events as flushed** — in the `FrameDone` handler, when a chunk is written and the buffer is cleared, call `p.tracker.markFlushed(p.totalChunksProcessed)` so events in that chunk are flagged as `flushed = true`.

**After `flushBatch()` at end of parse:**
```go
if err := p.tracker.flushPendingPatches(p.repo); err != nil {
    return fmt.Errorf("failed to patch transient events: %w", err)
}
```

---

### 4 — Go: Add MongoDB patch method to `repository.go`

File: `backend/demo-composer/parser/repository.go`

```go
type TransientEventPatch struct {
    ChunkIndex int
    FrameIndex int
    EventIndex int
    EndedAt    int
}

func (r *Repository) PatchTransientEventEndedAt(demoID string, patches []TransientEventPatch) error {
    if len(patches) == 0 {
        return nil
    }
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    for _, p := range patches {
        filter := bson.M{
            "demo_id":     demoID,
            "chunk_index": p.ChunkIndex,
        }
        update := bson.M{
            "$set": bson.M{
                fmt.Sprintf("frames.%d.events.%d.data.ended_at", p.FrameIndex, p.EventIndex): p.EndedAt,
            },
        }
        if _, err := r.chunksCol.UpdateOne(ctx, filter, update); err != nil {
            return err
        }
    }
    return nil
}
```

Using direct array index paths (`frames.N.events.M.data.ended_at`) is safe because the chunk documents are immutable after write — no concurrent modifications.

---

### 5 — TypeScript: No new DB schema needed

The `ended_at` field is stored inside `Event.data` which is already typed as `map[string]interface{}` / `Record<string, unknown>` / `Schema.Types.Mixed`. No schema changes required.

---

### 6 — Domain: Extend command

File: `backend/domain/src/commands/GetTickSeekReadableStreamCommand.ts`

```ts
export interface GetTickSeekReadableStreamCommand extends GenericCommand<"get_tick_seek_readable_stream"> {
  matchId: string;
  startGameTick: number;
  endGameTick: number;
  step: number;
  includeTransientEvents?: boolean;  // ADD
}

export interface GetTickSeekReadableStreamCommandResult {
  frames: DemoChunkEntity["frames"];
  transientEvents?: DemoEvent[];     // ADD — reuse existing DemoEvent type
}
```

`DemoEvent` already exists in `DemoChunkEntity.ts` — no new entity type needed.

---

### 7 — Domain: Extend outbound port

File: `backend/domain/src/ports/outbound/MatchOutboundPort.ts`

Add one method:
```ts
getTransientEventsAtTick(
  demoId: string,
  gameTick: number,
  lookbackTicks: number,
): Promise<DemoEvent[]>;
```

`lookbackTicks` is the configurable window — how far back to search for start events. Passed in from handler config.

---

### 8 — Domain: Config port

The look-back window should be configurable. Add a constant or config value in the domain layer — simplest is a named constant in the handler file:

```ts
const TRANSIENT_EVENT_LOOKBACK_TICKS = 3000; // ~47 seconds at 64-tick
```

This can be promoted to `ConfigurationInboundPort` later if it needs to be dynamic.

---

### 9 — Domain: Extend handler

File: `backend/domain/src/handlers/GetTickSeekReadableStreamCommandHandler.ts`

```ts
let transientEvents: DemoEvent[] | undefined;
if (command.includeTransientEvents) {
  transientEvents = await outbound.matchRepository.getTransientEventsAtTick(
    match.demoId,
    command.startGameTick,
    TRANSIENT_EVENT_LOOKBACK_TICKS,
  );
}
return { frames: ticksInRange, transientEvents };
```

---

### 10 — API: Implement `getTransientEventsAtTick` in `MatchRepository.ts`

File: `backend/api/src/repository/MatchRepository.ts`

Query: scan chunks that overlap the look-back window `[startGameTick - lookbackTicks, startGameTick]`, unwind frames and events, filter for start event types whose `data.ended_at > startGameTick` (still in flight):

```ts
async getTransientEventsAtTick(
  demoId: string,
  gameTick: number,
  lookbackTicks: number,
): Promise<DemoEvent[]> {
  const startEventTypes = Object.keys(EVENT_LIFECYCLE_MAP); // mirror of Go map keys
  const windowStart = gameTick - lookbackTicks;

  const result = await this.database.DemoChunkModel.aggregate([
    {
      $match: {
        demo_id: demoId,
        end_game_tick: { $gte: windowStart },
        start_game_tick: { $lte: gameTick },
      },
    },
    { $unwind: "$frames" },
    {
      $match: {
        "frames.game_tick": { $gte: windowStart, $lte: gameTick },
      },
    },
    { $unwind: "$frames.events" },
    {
      $match: {
        "frames.events.type": { $in: startEventTypes },
        "frames.events.data.ended_at": { $gt: gameTick },
      },
    },
    {
      $replaceRoot: { newRoot: "$frames.events" },
    },
  ]);

  return result.map(toDemoChunkEvent); // reuse existing event mapper
}

const EVENT_LIFECYCLE_MAP: Record<string, string[]> = {
  grenade_throw:      ["grenade_destroy", "grenade_he_explode", "grenade_flash_explode", "round_end"],
  grenade_fire_start: ["grenade_fire_end", "round_end"],
  bomb_planted:       ["bomb_exploded", "bomb_defused", "round_end"],
  bomb_defuse_start:  ["bomb_defuse_aborted", "bomb_defused", "round_end"],
};
```

---

### 11 — API: Extend seek endpoint

File: `backend/api/src/controllers/StreamingController.ts`

- Add `includeTransientEvents: t.Optional(t.String())` to `query` schema
- Pass `includeTransientEvents: includeTransientEvents === "true"` to command
- Return `{ frames: result.frames, transientEvents: result.transientEvents }`
- Update response type: `BaseResponse<{ frames: DemoChunkEntity["frames"]; transientEvents?: DemoEvent[] }>`

---

## File Summary

| Action | File |
|--------|------|
| Modify | `backend/demo-composer/parser/types.go` |
| **Create** | `backend/demo-composer/parser/transient_tracker.go` |
| Modify | `backend/demo-composer/parser/parser.go` |
| Modify | `backend/demo-composer/parser/repository.go` |
| Modify | `backend/domain/src/commands/GetTickSeekReadableStreamCommand.ts` |
| Modify | `backend/domain/src/ports/outbound/MatchOutboundPort.ts` |
| Modify | `backend/domain/src/handlers/GetTickSeekReadableStreamCommandHandler.ts` |
| Modify | `backend/api/src/repository/MatchRepository.ts` |
| Modify | `backend/api/src/controllers/StreamingController.ts` |

No new DB schemas, models, or migrations needed.

---

## Verification

1. Rebuild Go binary: `cd backend/demo-composer && go build -o main.bin ./cmd/main.go`
2. Parse a `.dem` file. In MongoDB `demo_chunks`, find a `grenade_throw` event and confirm its `data.ended_at` is set.
3. Find a grenade that crossed a chunk boundary (throw in chunk N, destroy in chunk N+1). Confirm `ended_at` was patched via the second-pass update.
4. `GET /streaming/player/seek/:matchId?startGameTick=X&endGameTick=Y&step=16` — response unchanged.
5. Same URL with `&includeTransientEvents=true` — response includes `transientEvents` array of start events with `ended_at > X`.
6. Type-check: `bun --filter @demo-viewer/domain type-check && bun --filter @demo-viewer/api type-check`