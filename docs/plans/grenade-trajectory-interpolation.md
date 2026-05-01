# Context

Currently grenade events (`grenade_throw`, `grenade_destroy`) only capture a single position snapshot. We want to use `GrenadeProjectile.Trajectory2` (v4 API) to embed the full flight path in the `grenade_throw` event, so the frontend can interpolate the grenade mesh across the map. `grenade_destroy` remains a "remove mesh" signal only.

**Point count:** At 64 tick a 2–3 second grenade yields ~128–192 `TrajectoryEntry` points. Each entry carries `Tick`, `Time`, `FrameID`, and `Position (r3.Vector)` — no manual tick math needed.

**Key insight:** `Trajectory2` is built incrementally; it is complete only at `GrenadeProjectileDestroy`. The Go parser must therefore buffer the throw-event data, append the trajectory on destroy, and then emit both events.

---

# Plan

## 1. Go parser — `backend/demo-composer/parser/`

### 1a. Trajectory encoding

Trajectory is stored as a **flat `[]float64` buffer** in the format `[tick, x, y, z, tick, x, y, z, ...]`. This avoids per-entry object overhead — for 150 points it's 600 numbers vs 150 JSON objects.

No separate `TrajectoryPoint` struct is needed. In Go:

```go
traj := make([]float64, 0, len(e.Projectile.Trajectory2)*4)
for _, entry := range e.Projectile.Trajectory2 {
    traj = append(traj,
        float64(entry.Tick),
        entry.Position.X,
        entry.Position.Y,
        entry.Position.Z,
    )
}
throwData["trajectory"] = traj
```

On the frontend, read in strides of 4:
```ts
for (let i = 0; i < trajectory.length; i += 4) {
  const tick = trajectory[i], x = trajectory[i+1], y = trajectory[i+2], z = trajectory[i+3];
}
```

### 1b. Buffer pending throw data in `parser.go`

Add a map to the `Parser` struct (or closure scope):

```go
pendingGrenades map[int]map[string]interface{} // entity_id → throw event data
```

### 1c. `GrenadeProjectileThrow` handler

Store data into `pendingGrenades[entityID]` instead of emitting immediately. Do **not** call `addEventToCurrentFrame` yet.

```go
parser.RegisterEventHandler(func(e events.GrenadeProjectileThrow) {
    id := e.Projectile.Entity.ID()
    data := map[string]interface{}{
        "weapon":           e.Projectile.WeaponInstance.String(),
        "grenade_entity_id": id,
        "grenade_position": Vector3{...},
    }
    if e.Projectile.Thrower != nil {
        data["thrower_steam_id_64"] = ...
        data["thrower_name"] = ...
    }
    pendingGrenades[id] = data
})
```

### 1d. `GrenadeProjectileDestroy` handler

1. Look up `pendingGrenades[entityID]`.
2. Read `e.Projectile.Trajectory2`, encode as flat `[]float64` buffer (see §1a).
3. Attach `trajectory` to the buffered throw data and emit `grenade_throw`.
4. Emit `grenade_destroy` (position only — signals mesh removal).
5. Delete from `pendingGrenades`.

> **Note on tick placement:** The throw event is emitted on the destroy frame. The frontend uses `trajectory[0]` (the first tick in the buffer) to know when to spawn the mesh, so the frame it appears in doesn't matter.

```go
parser.RegisterEventHandler(func(e events.GrenadeProjectileDestroy) {
    id := e.Projectile.Entity.ID()
    throwData, ok := pendingGrenades[id]
    if ok {
        traj := make([]float64, 0, len(e.Projectile.Trajectory2)*4)
        for _, entry := range e.Projectile.Trajectory2 {
            traj = append(traj,
                float64(entry.Tick),
                entry.Position.X,
                entry.Position.Y,
                entry.Position.Z,
            )
        }
        throwData["trajectory"] = traj
        p.addEventToCurrentFrame("grenade_throw", throwData)
        delete(pendingGrenades, id)
    }

    // destroy signal
    pos := e.Projectile.Position()
    p.addEventToCurrentFrame("grenade_destroy", map[string]interface{}{
        "weapon":           e.Projectile.WeaponInstance.String(),
        "grenade_entity_id": id,
        "grenade_position": Vector3{X: float64(pos.X), Y: float64(pos.Y), Z: float64(pos.Z)},
    })
})
```

---

## 2. Shared types

**File:** `@demo-viewer/shared-types` (locate exact path).

Extend the grenade throw event data type to include `trajectory: number[]` — a flat buffer of `[tick, x, y, z, ...]` quads. No separate interface needed.

---

## 3. Frontend — grenade mesh entity

**New file:** `frontend/demo-viewer/src/modules/demo-viewer/entities/GrenadeMesh.ts`

Mirrors the existing `PlayerPawnMesh.ts` pattern.

- Constructor takes a `THREE.Scene` and grenade type (for visual differentiation later).
- Holds the `trajectory: number[]` flat buffer and `destroyTick: number`.
- `updatePosition(currentTick: number)`: binary-search the trajectory for the two bracketing points, lerp position. Uses the existing `tlerp` helper at `src/lib/tlerp.ts`.
- `dispose()`: removes mesh from scene.

---

## 4. Frontend — wire into `DemoViewerViewModel.tsx`

In the `_drawFrame` / event notification path (line ~137 where `_notify(evt.type, evt.data)` is called):

- On `grenade_throw`: instantiate a `GrenadeMesh`, store in a `Map<number, GrenadeMesh>` keyed by `grenade_entity_id`.
- On `grenade_destroy`: call `.dispose()` and remove from the map.
- Each `tick` loop iteration: call `mesh.updatePosition(currentTick)` for all active grenades.

---

## Critical files

| File | Change |
|------|--------|
| `backend/demo-composer/parser/types.go` | No change needed (flat `[]float64` used inline) |
| `backend/demo-composer/parser/parser.go` | Buffer throw, emit on destroy with trajectory |
| `@demo-viewer/shared-types` (locate exact path) | Add `TrajectoryPoint` TS type |
| `frontend/demo-viewer/src/modules/demo-viewer/entities/GrenadeMesh.ts` | New entity (mirrors PlayerPawnMesh) |
| `frontend/demo-viewer/src/modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx` | Handle grenade_throw / grenade_destroy events |

---

## Verification

1. Rebuild the Go binary: `cd backend/demo-composer && go build -o main.bin ./cmd/main.go`
2. Re-parse a demo and inspect a `grenade_throw` event in MongoDB — confirm `trajectory` array is present with 100+ points.
3. Run the frontend dev server: `bun run dev:frontend`
4. Play back a demo and confirm grenade meshes appear, travel along the correct path, and disappear on destroy.
5. Run type-check: `bun run type-check`
