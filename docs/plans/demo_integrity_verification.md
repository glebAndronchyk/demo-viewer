# Plan: Parsed Demo Data Integrity Verification

## Context

After parsing a CS2 demo, frames and events are silently streamed to MongoDB in chunks. There are currently no completeness checks — a dropped batch, a truncated parse, or a parser hang would result in partial data with no signal. The goal is to detect missing/incomplete data **at parse time and immediately after**, before bad data reaches consumers.

---

## Core Problem: What "completeness" means for a CS2 demo

A parsed demo should satisfy these invariants:

1. **Tick continuity** — chunks cover a contiguous tick range with no gaps: `chunk[i].end_tick + 1 == chunk[i+1].start_tick`
2. **Round coverage** — every `round_start` event has a corresponding `round_end` event
3. **Expected chunk count** — `match.chunk_count` matches the actual number of chunks in `demo_chunks`
4. **Frame density** — no chunk has abnormally few frames (could indicate a flush bug or dropped batch)
5. **Participant presence** — every participant listed in `match.participants` appears in at least one frame's player states
6. **Duration consistency** — total ticks across all chunks match the header's `playback_ticks` (±tolerance for partial last frame)

---

## Approach: Two-layer verification

### Layer 1 — Post-parse integrity check in the Go parser

**Where:** `backend/demo-composer/parser/repository.go` — after `FinalizeMatch`

**What to add:** A `VerifyParsedDemo(demoID string) error` function that:
- Queries MongoDB for all chunks of the demo (sorted by `chunk_index`)
- Checks tick continuity between consecutive chunks
- Checks `chunk_count` matches actual count
- Checks every chunk has `len(frames) >= minExpected` (e.g. > 0, warn if < 5)
- Returns a structured `IntegrityReport` with pass/fail per check + details

**Emit as stderr/structured output:** The report gets logged by the TypeScript wrapper. On critical failure, exit with non-zero code so `ParserRepository.ts` throws and the job is marked failed.

### Layer 2 — Domain-level integrity flag on the match record

**Where:** `backend/database/src/schemas/match.schema.ts`

**What to add:** An `integrity` sub-document on the match:
```ts
integrity: {
  verified: boolean,       // did verification pass?
  checked_at: Date,
  issues: string[],        // list of human-readable failures
}
```

After parsing, `FinalizeMatch` (or a new `RecordIntegrity` call) writes this field. The API can expose it so consumers know whether to trust a given demo.

---

## Critical files to modify

| File | Change |
|------|--------|
| `backend/demo-composer/parser/repository.go` | Add `VerifyParsedDemo()` + `IntegrityReport` struct |
| `backend/demo-composer/parser/parser.go` | Call verify after `FinalizeMatch`, propagate errors |
| `backend/demo-composer/cmd/main.go` | Print integrity report summary to stderr |
| `backend/database/src/schemas/match.schema.ts` | Add `integrity` sub-document field |
| `backend/database/src/types/` (match types) | Add `integrity` to TypeScript interface |

---

## Specific integrity checks (priority order)

1. **Chunk count mismatch** — `chunk_count` field vs `COUNT(demo_chunks WHERE demo_id=X)` → critical
2. **Tick gap** — consecutive chunks don't connect → critical
3. **Empty chunk** — any chunk has `frames == []` → critical
4. **Playback tick coverage** — `sum(frames per chunk)` vs header `playback_ticks` → warning (±5%)
5. **Round parity** — `round_start` count == `round_end` count across all chunks → warning (last round may be incomplete)
6. **Orphaned participants** — participant in `match.participants` never appears in frames → warning

---

## Verification / Testing

1. Parse a known good demo → integrity report should show all checks passing, `integrity.verified = true` in MongoDB
2. Simulate a partial parse (kill parser mid-way) → verify `integrity.verified = false` with tick gap error
3. Query `db.matches.find({ "integrity.verified": false })` to confirm bad records are flagged
4. Check TypeScript wrapper propagates non-zero exit when critical check fails

---

## Out of scope

- Re-parsing existing data (that's an audit job, not early detection)
- Round-by-round semantic validation (positions look physically possible, etc.)
- Cross-demo consistency (e.g., player stats across matches)