# Plan: Exclude Dropped/Refunded Items from Economy Calculations

## Context

`MatchPlayerEconomyCalculator` computes round buy type (eco/force/full-buy) based on items the player bought. There is already a `// todo: include "and not dropped" check` comment in the file.

Two distinct corrections are needed:

- **Dropped items** are still an expense (player paid for them), but they are no longer in the player's inventory. They should be **excluded from `totalEquipmentValue`** only.
- **Refunded items** are money-back — they should be **excluded from both `expensesAmount` and `totalEquipmentValue`**.

Correlation uses `weapon_entity_id` — a guaranteed-unique ULID per weapon instance (`Equipment.UniqueID2()` in demoinfocs).

No changes to `AnalyticsQueryBuilder`, `MatchEvent`, or `MatchRepository` needed.

## Files to Modify

1. **`backend/demo-composer/parser/parser.go`** — emit `weapon_entity_id` for `item_pickup`, `item_drop`, and `item_refund`
2. **`backend/domain/src/entities/events/ItemPickupEvent.ts`** — add `weaponEntityId: string | null` field
3. **`backend/domain/src/entities/events/ItemDropEvent.ts`** — add `weaponEntityId: string | null` field
4. **`backend/domain/src/entities/events/ItemRefundEvent.ts`** — add `weaponEntityId: string | null` field
5. **`backend/domain/src/operations/analytics/MatchPlayerEconomyCalculator.ts`** — add drop/refund events to `sharedQuery`; apply exclusions in `getPerPlayerInfo`

## Implementation Steps

### Step 1 — Go parser: emit `weapon_entity_id`

In `parser.go`, for `item_pickup`, `item_drop`, and `item_refund` handlers, add:
```go
if e.Weapon != nil {
    data["weapon_entity_id"] = e.Weapon.UniqueID2().String()
}
```

Rebuild: `cd backend/demo-composer && go build -o main.bin ./cmd/main.go`

### Step 2 — Add `weaponEntityId` to event entities

For `ItemPickupEvent`, `ItemDropEvent`, and `ItemRefundEvent`, add `readonly weaponEntityId: string | null` to the constructor (before tick fields) and parse in `fromRaw`:
```ts
typeof d["weapon_entity_id"] === "string" ? d["weapon_entity_id"] : null,
```

### Step 3 — `MatchPlayerEconomyCalculator.ts`

**`sharedQuery`** — add drop and refund events:
```ts
const events = await this.matchOutbound.getAggregatedEvents(
  { matchId: this.matchId },
  [
    ItemPickupEvent.query().forPlayer(this.playerSteamId).asBought().build(),
    ItemDropEvent.query().asPlayer(this.playerSteamId).build(),
    ItemRefundEvent.query().asPlayer(this.playerSteamId).build(),
  ],
  {
    get: () => this.dbCache.get("sharedQuery") as [ItemPickupEvent[], ItemDropEvent[], ItemRefundEvent[]],
    set: (v) => this.dbCache.set("sharedQuery", v),
  },
);
```

**`getEventsPerRound`** — unchanged: returns all bought events within the round tick range.

**`getPerPlayerInfo`** — updated signature and logic:

```ts
private getPerPlayerInfo(
  roundStartFrame: Frame,
  roundBuyEvents: ItemPickupEvent[],
  roundDropEvents: ItemDropEvent[],
  roundRefundEvents: ItemRefundEvent[],
)
```

Inside:
- Build `droppedEntityIds` from `roundDropEvents` — excludes from `totalEquipmentValue` only
- Build `refundedEntityIds` from `roundRefundEvents` — excludes from both `expensesAmount` and `totalEquipmentValue`

```ts
const droppedEntityIds = new Set(
  roundDropEvents.filter((e) => e.weaponEntityId !== null).map((e) => e.weaponEntityId),
);
const refundedEntityIds = new Set(
  roundRefundEvents.filter((e) => e.weaponEntityId !== null).map((e) => e.weaponEntityId),
);

const expensesAmount = roundBuyEvents
  .filter((e) => e.weaponEntityId === null || !refundedEntityIds.has(e.weaponEntityId))
  .reduce((acc, curr) => acc + Weapon.getItemPickupEventPrice(curr), 0);

// totalEquipmentValue excludes both dropped and refunded items
const effectiveBuyEvents = roundBuyEvents.filter(
  (e) =>
    e.weaponEntityId === null ||
    (!droppedEntityIds.has(e.weaponEntityId) && !refundedEntityIds.has(e.weaponEntityId)),
);
const totalEquipmentValue = startEquipmentPrice +
  effectiveBuyEvents.reduce((acc, curr) => acc + Weapon.getItemPickupEventPrice(curr), 0);
```

Callers (`isRoundEcoBuy`, `isRoundForceBuy`, `isRoundFullBuy`) pass down the round's drop/refund events returned from `sharedQuery`.

Remove resolved `// todo` comments.

## Verification

```bash
bun run type-check
cd backend/demo-composer && go build -o main.bin ./cmd/main.go
```