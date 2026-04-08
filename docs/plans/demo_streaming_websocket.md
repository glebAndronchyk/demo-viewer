# Plan: Demo Streaming Initial Setup (WebSocket)

## Context

Demos are already parsed and stored as `DemoChunk` documents in MongoDB — each chunk holds ~100 frames (ticks), indexed by `demo_id` and `chunk_index`. The frontend has a 3D map viewer (React Three Fiber) but no data fetching or playback logic yet. The `StreamingController` exists but is empty. The goal is to wire up a WebSocket endpoint that streams demo chunks to the frontend, enabling a YouTube-like buffered player with per-tick jumping.

---

## Data Model (already exists)

- `demo_chunks` collection: `{ demo_id, chunk_index, start_tick, end_tick, frames[] }`
- Each frame: `{ demo_tick, player_states[], game_state, events[] }`
- Indexed on `{ demo_id, chunk_index }` (unique) and `{ demo_id, start_tick, end_tick }`
- ~100 frames/chunk at 64 tick ≈ 1.5s of gameplay per chunk

---

## WebSocket Protocol

```
Client → Server:
  { type: "subscribe", demo_id: string, start_chunk: number }
  { type: "seek", demo_id: string, chunk_index: number }
  { type: "unsubscribe" }

Server → Client:
  { type: "meta", demo_id: string, total_chunks: number }
  { type: "chunk", chunk_index: number, start_tick: number, end_tick: number, frames: IFrame[] }
  { type: "end" }
  { type: "error", message: string }
```

---

## Implementation Steps

### 1. Backend — `DemoChunkRepository`

**File to create**: `backend/api/src/repository/DemoChunkRepository.ts`

- `getChunk(demo_id: string, chunk_index: number)` — `DemoChunkModel.findOne({ demo_id, chunk_index }).lean()`
- `getChunkCount(demo_id: string)` — `DemoChunkModel.countDocuments({ demo_id })`

### 2. Backend — `StreamingController`

**File to modify**: `backend/api/src/controllers/StreamingController.ts`

Use Elysia's native `.ws()` at path `/streaming/demo`:

- On `subscribe`: send `meta` message with `total_chunks`, then stream chunks sequentially from `start_chunk`
- On `seek`: stream chunks sequentially from the requested `chunk_index`
- On each chunk: send `{ type: "chunk", ...chunk }`
- After last chunk: send `{ type: "end" }`
- On `unsubscribe`: close the socket

### 3. Backend — DI Registration

**File to modify**: `backend/api/src/index.ts`

```typescript
.addSingleton(DemoChunkRepository, [DatabaseService])
.addSingleton(StreamingController, [TypedApp, CommandBusService, DemoChunkRepository])
```

### 4. Frontend — `useDemoStream` hook

**File to create**: `frontend/demo-viewer/src/modules/demo-viewer/hooks/useDemoStream.ts`

- Opens native `WebSocket` to `ws://localhost:<port>/streaming/demo`
- On open: sends `subscribe` message
- Accumulates incoming `chunk` messages into `chunks` state array
- Stores `meta` (total_chunks) in separate state
- Cleans up (closes WS) on unmount or when `demoId` changes

Returns: `{ chunks, meta, isConnected }`

### 5. Frontend — Tick playback in `DemoViewer`

**File to modify**: `frontend/demo-viewer/src/modules/demo-viewer/components/DemoViewer.tsx`

- Accept `demoId` prop (or hardcode for initial testing)
- Use `useDemoStream(demoId)` to get buffered chunks
- Add `currentTick` state controlled by `<input type="range">` scrubber (min=0, max=total ticks)
- Derive current frame: find chunk where `start_tick <= currentTick <= end_tick`, then find frame by `demo_tick`
- Render player positions as spheres on the 3D map plane

---

## Critical Files

| File | Action |
|------|--------|
| `backend/api/src/repository/DemoChunkRepository.ts` | Create |
| `backend/api/src/controllers/StreamingController.ts` | Modify |
| `backend/api/src/index.ts` | Modify |
| `frontend/demo-viewer/src/modules/demo-viewer/hooks/useDemoStream.ts` | Create |
| `frontend/demo-viewer/src/modules/demo-viewer/components/DemoViewer.tsx` | Modify |

---

## Verification

1. Start backend: `bun run dev` in `backend/api`
2. Connect to `ws://localhost:<port>/streaming/demo` via wscat or similar
3. Send `{"type":"subscribe","demo_id":"<valid_id>","start_chunk":0}`
4. Confirm: `meta` arrives → `chunk` messages stream → `end` message arrives
5. Start frontend: `bun run dev` in `frontend/demo-viewer`
6. Pass a `demoId` to `DemoViewer`, confirm chunks accumulate in state
7. Move the tick scrubber and verify player dots update position on the map

---

## Deferreds (next iteration)

- **Demand-driven buffering**: Client requests next chunk as buffer drains, instead of server pushing all at once
- **Type sharing**: Extract `IFrame`/`IDemoChunk` types into shared package for frontend import
- **CORS/WS origin**: Configure Elysia CORS plugin if Vite dev server origin is blocked
- **Playback clock**: Auto-advance `currentTick` at tick rate (64/128 Hz) using `requestAnimationFrame`
- **Chunk size tuning**: Adjust `framesInChunkCount` in parser for optimal buffer size