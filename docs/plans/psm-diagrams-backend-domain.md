# Plan: PSM Diagrams for backend/domain using tplant

## Context

The user wants Platform-Specific Model (PSM) diagrams for the project, generated via `tplant` (TypeScript → PlantUML). PSM is correct here: it's a model tied to a specific platform/technology (TypeScript + hexagonal architecture), showing actual class/interface shapes. The goal is one feature per diagram, small enough to fit on A4.

**Note on PSM correctness**: PSM diagrams should show the concrete implementation detail (actual TypeScript types, generics, method signatures) as opposed to a PIM which is platform-neutral. `tplant` output is a valid PSM input — it auto-extracts class/interface structure directly from the TS source.

---

## Diagram Split Strategy (backend/domain)

| # | Diagram Name | Files Covered | Why |
|---|---|---|---|
| 1 | **Command Bus** | `lib/command_bus/` (all 6 files) | Self-contained infrastructure: `CommandBus`, `GenericCommand`, `GenericCommandHandler`, `HandlerRegistration`, `CommandsMap`, `buildOperations` |
| 2 | **Domain Ports** | `ports/inbound/`, `ports/outbound/` + `types/DomainOutbound.ts` | All 9 port interfaces + the `DomainOutbound` bundle — the hexagonal boundary layer |
| 3 | **Match Event Entities** | ALL `entities/events/*.ts` — `MatchEvent.ts`, `AnalyticsQueryBuilder.ts`, and all 22 concrete event classes (Kill, Hurt, WeaponFire, PlayerFlashed, Round*, Grenade*, Bomb*, Hostage, Item*, PlayerConnect/Disconnect, WeaponReload) | All events share `MatchEvent` base and `AnalyticsQueryBuilder` — cohesive A4-landscape diagram |
| 4 | **Analytics Calculator Layer** | `operations/analytics/types/AnalyticsCalculator.ts` + all 7 `Match*Calculator.ts` + output entities (`PlayerStatsEntity`, `PlayerClutchesEntity`, `PlayerWeaponsUsageEntity`, `PlayerWeaponStatsEntity`, `PlayerUtilityEntity`, `PlayerEconomyEntity`, `PlayerAccuracyEntity`, `PlayerAnalyticalEntity`) | Calculators + their return types |

---

## Implementation Steps

### 1. Install tplant (if not globally available)
```bash
npx tplant --version   # already confirmed: 3.1.2
```

### 2. Generate PlantUML files per diagram

For each diagram, run `tplant` against the specific source files:

```bash
npx tplant \
  --input "backend/domain/src/lib/command_bus/*.ts" \
  --output "docs/diagrams/domain/01-command-bus.puml"
```

Repeat for each diagram group above. tplant accepts glob patterns for `--input`.

### 3. Review & Iterate

- Open each `.puml` in a PlantUML preview to check A4 fit
- If a diagram is too large, split further; if too sparse, merge
- Add `skinparam` directives to `.puml` files for A4 page sizing and readability

---

## Output Directory

```
docs/diagrams/
  domain/
    01-command-bus.puml
    02-domain-ports.puml
    03-match-events.puml
    04-analytics-calculators.puml
```

---

## Verification

1. Each `.puml` renders without errors
2. Each diagram fits comfortably on A4 (landscape where needed)
3. All key relationships (inheritance, interface implementation, associations) are visible
4. No cross-diagram dependencies that would make a diagram unreadable in isolation (ports diagram is the shared reference)
