# Plan: Team Demo Upload & Team Statistics Feature

## Context

The user story (currently crossed out in `docs/teams.md` as planned-but-not-yet-designed):

> "As a team owner, I want to be able to upload demo files that will be taken into account in the calculation of team statistics."

Currently, demo parsing is tied to individual users via Valve's Game Coordinator share-code chain (`DownloadAndParseDemoCommand`). There is no way for a team to collectively own matches or view aggregated team statistics. The `Match` document already has a `group_id` field (indexed) but it is never populated.

This plan introduces a direct `.dem` file upload path for team owners and extends statistics queries to operate on a team's match pool.

---

## Data Model

### Existing (unchanged)

- `Match.group_id` — already exists in schema and indexed; currently always `null`
- `Match.participants[].user_id` — links players to registered users
- `DemoChunk.frames[].player_states[].steam_id_64` — raw Steam IDs per frame
- `PlayerStats` collection — per-player, per-match stats

### New: no schema migrations needed

`group_id` on `Match` is already available. We only need to populate it during team-owned uploads.

---

## Feature Breakdown

### 1. Team Demo Upload Endpoint

**Route:** `POST /team/owner/:groupId/demo` (multipart form, `.dem` file)

**Auth:** `teamOwnerPlugin` (already exists)

**Flow:**

```
Owner uploads .dem file
  ↓
TeamController validates file type/extension
  ↓
UploadTeamDemoCommand { groupId, requesterId, fileBuffer }
  ↓
UploadTeamDemoHandler
  ├─ verify requester is owner (defense-in-depth via teamRepository.getTeamById)
  ├─ save file to storage: fileStorage.saveAsset(`teams/${groupId}/<demoId>.dem`)
  └─ enqueue parsing job via queue.enqueue(ParseTeamDemoJob)
        ↓
    ComputeResourcesQueueService drains queue
        ↓
    parserRepository.parseDemoFromLocal(localPath, groupId)
        ↓
    demo-composer parses → Match saved with group_id populated
```

### 2. Parser Extension

`ParserOutbound` currently exposes `parseDemoFromRemote(url, shareCode)`. Add:

```
parseDemoFromLocal(filePath: string, groupId: string): Promise<{ pid: number; promise: Promise<void> }>
```

`ParserRepository` implements this by invoking the `demo-composer` binary with the local file path instead of a URL, and passing `groupId` so the Match document is written with `group_id` set.

### 3. Team Match Listing

**Route:** `GET /team/member/:groupId/matches` (auth: `teamMemberPlugin`)

**Command:** `GetTeamMatchesCommand { groupId, requesterId, page?, limit? }`

**Handler:** queries `matchRepository.findByGroupId(groupId)` — already indexed.

### 4. Team Statistics

**Route:** `GET /team/member/:groupId/stats` (auth: `teamMemberPlugin`)

**Command:** `GetTeamStatsCommand { groupId, requesterId }`

**Handler:**
1. Fetch all match IDs for the group via `matchRepository.findByGroupId(groupId)`
2. Fetch all `PlayerStats` documents for those match IDs
3. Aggregate per player across all matches (totals + averages)
4. Return ranked leaderboard by KPR, ADR, or rating

No new calculator class needed — reuse existing `PlayerStats` documents already stored in MongoDB (if they exist for uploaded demos).

---

## Files to Create

### Domain layer (`backend/domain/src/`)

| File | Purpose |
|---|---|
| `commands/UploadTeamDemoCommand.ts` | Command + result types |
| `handlers/UploadTeamDemoHandler.ts` | Validates owner, stores file, enqueues parse |
| `commands/GetTeamMatchesCommand.ts` | Command + result types |
| `handlers/GetTeamMatchesHandler.ts` | Returns paginated match list for group |
| `commands/GetTeamStatsCommand.ts` | Command + result types |
| `handlers/GetTeamStatsHandler.ts` | Aggregates PlayerStats across group matches |

Register all 3 new handlers in `backend/domain/src/handlers/index.ts`.

### API layer (`backend/api/src/`)

| File | Purpose |
|---|---|
| `controllers/TeamController.ts` | Add 3 new routes (modify existing file) |
| `repository/MatchRepository.ts` | Add `findByGroupId(groupId)` (modify existing file) |
| `repository/ParserRepository.ts` | Add `parseDemoFromLocal(filePath, groupId)` (modify) |

### Domain ports (`backend/domain/src/ports/outbound/`)

| File | Change |
|---|---|
| `MatchOutboundPort.ts` | Add `findByGroupId(groupId: string): Promise<MatchEntity[]>` |
| `ParserOutbound.ts` | Add `parseDemoFromLocal(filePath: string, groupId: string): Promise<{ pid: number; promise: Promise<void> }>` |

---

## Files to Modify

| File | Change |
|---|---|
| `backend/domain/src/handlers/index.ts` | Export 3 new registrations |
| `backend/domain/src/ports/outbound/MatchOutboundPort.ts` | Add `findByGroupId` |
| `backend/domain/src/ports/outbound/ParserOutbound.ts` | Add `parseDemoFromLocal` |
| `backend/api/src/repository/MatchRepository.ts` | Implement `findByGroupId` |
| `backend/api/src/repository/ParserRepository.ts` | Implement `parseDemoFromLocal` |
| `backend/api/src/controllers/TeamController.ts` | Add 3 new routes |
| `docs/teams.md` | Unstrike the user story, add new routes to API table |

---

## New API Routes (summary)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/team/owner/:groupId/demo` | teamOwnerPlugin | Upload a `.dem` file; enqueues parsing with group_id |
| `GET` | `/team/member/:groupId/matches` | teamMemberPlugin | List matches owned by the group |
| `GET` | `/team/member/:groupId/stats` | teamMemberPlugin | Aggregated per-player stats across team matches |

---

## Key Design Decisions

- **No new DB migrations** — `group_id` already exists on `Match`, indexed.
- **Reuse existing queue** — `ComputeResourcesQueueService` already handles resource-limited parsing; team uploads use the same queue.
- **Reuse existing `PlayerStats`** — aggregation reads from the `player_stats` collection already populated after parsing; no new stats engine needed.
- **Defense-in-depth** — handlers re-check ownership via `teamRepository.getTeamById` even after `teamOwnerPlugin` guards the route.
- **File storage** — uploaded `.dem` files stored under `teams/<groupId>/<demoId>.dem` using the existing `StorageOutboundPort`; local dev uses `LocalFilesystemStorageAdapter`.

---

## Verification

```bash
# Type-check across all packages
bun run type-check

# Run backend domain tests
bun --filter @demo-viewer/tests test:backend

# Start dev server and exercise new endpoints via OpenAPI UI
bun run dev:api
# → http://localhost:<port>/openapi
```

Manual test flow:
1. Auth as a user, create a team
2. Upload a `.dem` file as team owner → expect 200 + demo enqueued
3. Poll `GET /team/member/:groupId/matches` → match appears after parse completes
4. `GET /team/member/:groupId/stats` → returns per-player stats aggregated across team matches
5. Non-member requests to member routes → 403
6. Non-owner requests to owner route → 403