# Plan: Convert Reference ID Fields from String to ObjectId

## Context

All foreign-key reference fields (e.g. `stats_id`, `player_weapon_usage_id`, `match_id`, `map_id`, etc.) are stored as plain strings. This causes silent `$lookup` failures because MongoDB cannot join `ObjectId` (`_id`) against `string` (`stats_id`) — they are different BSON types. The fix stores these fields as `ObjectId` natively, enabling proper DB-level relations and efficient index usage.

**Architectural constraint**: The domain layer (`backend/domain/`) must stay mongoose-free. Domain entities keep `statsId: string`. The ObjectId conversion happens at the infrastructure boundary — in the mapper and repository layers inside `backend/api/`.

---

## Scope

### Fields to convert

| Field | Collections |
|---|---|
| `stats_id` | player_accuracy, player_reaction, player_behavior, player_utility, player_trades, player_economy, player_clutches, player_weapons_usage, utility_schema, positions_stats |
| `player_weapon_usage_id` | weapon_stats |
| `sector_id` | positions_stats |
| `match_id` | player_stats |
| `map_id` | matches, map_sectors |
| `group_id` | matches, group_members |
| `user_id` | group_members, matches.participants |
| `owner_id` | groups |
| `asset_id` | maps |

---

## Implementation Steps (execute in order)

### Step 1 — Database Types (`backend/database/src/types/`)

Change reference fields from `string` to `Types.ObjectId`. Add `Types` import where missing.

- `performance.types.ts` — `stats_id` in `IPlayerAccuracy`, `IPlayerReaction`, `IPlayerBehavior`, `IPlayerUtility`
- `round_outcome.types.ts` — `stats_id` in `IPlayerTrades`, `IPlayerEconomy`, `IPlayerClutches`; add `Types` import
- `weapon.types.ts` — `stats_id` in `IPlayerWeaponsUsage`; `player_weapon_usage_id` in `IWeaponStats`
- `utility_positions.types.ts` — `stats_id` in `IUtilitySchema`, `IPositionsStats`; `sector_id` in `IPositionsStats`
- `player_stats.types.ts` — `match_id`; add `Types` import
- `match.types.ts` — `map_id`, `group_id`, `IParticipant.user_id`; add `Types` import
- `core.types.ts` — `owner_id`, `IGroupMember.user_id`, `group_id`, `asset_id`, `IMapSector.map_id`; add `Types` import

### Step 2 — Database Schemas (`backend/database/src/schemas/`)

Change `type: String` → `type: Schema.Types.ObjectId` and remove `trim: true` (invalid on ObjectId fields). Add `ref:` for documentation.

- `performance.schema.ts` — `stats_id` in all 4 schemas → `Schema.Types.ObjectId, ref: 'PlayerStats'`
- `round_outcome.schema.ts` — `stats_id` in all 3 schemas → `Schema.Types.ObjectId, ref: 'PlayerStats'`
- `weapon.schema.ts` — `stats_id` → `ref: 'PlayerStats'`; `player_weapon_usage_id` → `ref: 'PlayerWeaponsUsage'`
- `utility_positions.schema.ts` — `stats_id` in both schemas; `sector_id` → `ref: 'MapSector'`
- `player_stats.schema.ts` — `match_id` → `ref: 'Match'`
- `match.schema.ts` — `map_id` → `ref: 'Map'`; `group_id` → `ref: 'Group'`; `ParticipantSchema.user_id` → `ref: 'User'`
- `core.schema.ts` — `owner_id` → `ref: 'User'`; `GroupMember.user_id` → `ref: 'User'`; `group_id` → `ref: 'Group'`; `asset_id` → `ref: 'Asset'`; `MapSector.map_id` → `ref: 'Map'`

### Step 3 — Mappers: write path (`backend/api/src/mappers/player-analytics.mapper.ts`)

Add `statsId: Types.ObjectId` as a **second parameter** to every mapper function (instead of reading it from `entity.statsId`). The `Types` import already exists in this file.

```ts
// Before
export function toPlayerClutchesModel(entity: PlayerClutchesEntity): IPlayerClutches {
  return { stats_id: entity.statsId, ... }
}

// After
export function toPlayerClutchesModel(entity: PlayerClutchesEntity, statsId: Types.ObjectId): IPlayerClutches {
  return { stats_id: statsId, ... }
}
```

Apply same pattern to: `toPlayerEconomyModel`, `toPlayerUtilityModel`, `toPlayerWeaponsUsageModel`, `toPlayerAccuracyModel`.

For `toWeaponStatsModels`, change `usageId: string` → `usageId: Types.ObjectId`.

### Step 4 — Repository: write path (`backend/api/src/repository/MatchRepository.ts`, lines 88–147)

Remove all `.toString()` calls on `statsId` / `usageId` when calling mappers. Pass the raw `Types.ObjectId` directly as the second argument to each mapper.

```ts
// Before
toPlayerClutchesModel({ ...item, statsId: statsId.toString() } as PlayerClutchesEntity)

// After
toPlayerClutchesModel(item as PlayerClutchesEntity, statsId)
```

Apply same change for: economy (line 100–103), accuracy (107–110), utility (113–117), weaponsUsage (126–129), weaponStats (138–143).

Line 143: `toWeaponStatsModels({ ...weaponStatsEntity, statsId: statsId.toString() }, usageId.toString())` → `toWeaponStatsModels(weaponStatsEntity as PlayerWeaponStatsEntity, usageId)`

**Keep line 149 unchanged**: `return { rootCollectionId: statsId.toString() }` — this returns a string to the domain layer, which is correct.

### Step 5 — Mappers: read path

These convert DB documents back to domain entities — add `.toString()` where ObjectId is now read back as a string for the domain layer.

- `backend/api/src/mappers/player-clutches.mapper.ts` — `statsId: doc.stats_id.toString()`
- `backend/api/src/mappers/player-stats.mapper.ts` — `matchId: doc.match_id?.toString()`
- Any other read-side mappers that map `stats_id` → domain entity `statsId` field

### Step 6 — Fix DatabaseService bug (`backend/api/src/adapters/DatabaseService.ts`)

The `PlayerAccuracyModel` getter returns `PlayerEconomyModel` by mistake. Fix the return value and ensure `PlayerAccuracyModel` is imported.

### Step 7 — Migration

Create: `backend/database/migrations/20260418120000_stats_id_string_to_objectid.js`

**`up`**: For each affected collection, use a batched `bulkWrite` with `{ $type: 'string' }` filter (idempotent — skips already-converted docs) to convert string values to `new ObjectId(value)`. Then use `collMod` to update the JSON schema validator from `bsonType: 'string'` to `bsonType: 'objectId'` for each field.

Collections and fields:
- `player_accuracy`, `player_reaction`, `player_behavior`, `player_utility`, `player_trades`, `player_economy`, `player_clutches`, `player_weapons_usage`, `utility_schema`, `positions_stats` → `stats_id`
- `weapon_stats` → `player_weapon_usage_id`
- `positions_stats` → `sector_id`

**`down`**: Reverse — convert `ObjectId` back to hex string using `{ $type: 'objectId' }` filter, then restore string validators.

---

## Verification

1. `bun run type-check` — must compile clean after Steps 1–6
2. `bun run migrate:up` — apply migration on dev DB
3. Run the ad-hoc aggregation query (from `backend/database/queries/get_all_stats_per_player.mongosh`) — `$lookup` joins on `stats_id` should now return populated results without the `$toString` workaround
4. `bun --filter @demo-viewer/tests test:backend` — all existing tests must pass
5. Trigger a full analytics calculation end-to-end (via the cron or a manual command) and verify data is written and readable

---

## Critical Files

- `backend/api/src/mappers/player-analytics.mapper.ts`
- `backend/api/src/repository/MatchRepository.ts` (lines 88–149)
- `backend/api/src/adapters/DatabaseService.ts`
- `backend/database/src/types/` (7 files)
- `backend/database/src/schemas/` (7 files)
- `backend/database/migrations/20260418120000_stats_id_string_to_objectid.js` (new)
