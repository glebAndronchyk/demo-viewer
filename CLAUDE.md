# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime & Tooling

**Always use Bun**, not Node.js, npm, yarn, or pnpm:
- `bun <file>` / `bun run <script>` / `bun install` / `bun test`
- Bun automatically loads `.env` — do not use dotenv
- Prefer `Bun.file` over `node:fs`, `Bun.$` over `execa`

**Backend API**: Elysia (not Express). Use `Bun.serve()` for any raw servers.  
**Frontend**: Vite + React 19 + Three.js / React Three Fiber (not Bun HTML imports — the client uses a standard Vite setup).

## Commands

```bash
# Development
bun run dev:frontend      # starts @demo-viewer/client (Vite)
bun run dev:api           # starts @demo-viewer/api with --inspect & --watch

# Build all packages
bun run build

# Type-check all packages
bun run type-check

# Tests (bun:test)
bun run test                          # all tests
bun --filter @demo-viewer/tests test:backend    # backend only
bun --filter @demo-viewer/tests test:frontend   # frontend only
bun --filter @demo-viewer/tests test:coverage   # with coverage

# Run a single test file
bun test tests/backend/domain/MatchPlayerStatsCalculator.test.ts

# Database migrations (migrate-mongo)
bun run migrate:up
bun run migrate:down
bun run migrate:status
bun run migrate:create

# Build the Go demo parser binary
cd backend/demo-composer && go build -o main.bin ./cmd/main.go
```

## Workspace Structure

This is a Bun monorepo (`workspaces: ["backend/*", "frontend/*", "tests"]`).

```
backend/
  api/            @demo-viewer/api           — Elysia HTTP server (entry point)
  domain/         @demo-viewer/domain        — Pure domain logic (no framework deps)
  shared/         @demo-viewer/backend-shared — DI container, shared utilities
  database/       @demo-viewer/database      — Mongoose schemas, models, DB connection
  demo-composer/  @demo-viewer/demo-composer — Go CS2 demo parser binary + TS wrapper
  storage/map/    Static map radar assets (de_dust2, de_mirage, …)
frontend/
  demo-viewer/    @demo-viewer/client        — React + Vite + Three.js viewer
tests/
  backend/domain/ — Unit tests for domain logic
  frontend/       — Frontend tests
```

## Architecture

### Backend: Hexagonal / Ports & Adapters

The domain layer (`backend/domain/`) is framework-free and must never import from `@demo-viewer/database`, `@demo-viewer/api`, or any infrastructure package — only from `@demo-viewer/domain` itself and `@demo-viewer/backend-shared`.

The domain communicates with the outside world only through typed interfaces:

- **Inbound ports** (`src/ports/inbound/`) — e.g. `ConfigurationInboundPort`
- **Outbound ports** (`src/ports/outbound/`) — `AuthOutboundPort`, `MatchOutboundPort`, `ParserOutbound`, `StorageOutboundPort`, `QueueOutboundPort`, etc.
- **Commands** (`src/commands/`) — Plain data objects representing intent
- **Handlers** (`src/handlers/`) — One handler per command, receives `DomainOutbound` (all outbound ports bundled)
- **Entities** (`src/entities/`) — Plain TypeScript interfaces only — no Mongoose, no ORM types
- **Bindings** (`src/bindings/operations/`) — Wires handlers to the `CommandBus`

The API layer (`backend/api/`) contains:
- **Adapters** — Concrete implementations of outbound ports (`CommandBusService`, `LocalFilesystemStorageAdapter`, `SteamBotService`, `ComputeResourcesQueueService`, `DatabaseService`)
- **Repositories** — Implement outbound ports using DB models or external services
- **Mappers** (`src/mappers/`) — Convert Mongoose documents to domain entities; this is the only place that imports from both `@demo-viewer/database` and `@demo-viewer/domain`
- **Controllers** — Elysia route handlers, dispatch commands via `CommandBusService`
- **DI** — Manual constructor-injection via `DIContainer` (from `@demo-viewer/backend-shared`)

The `CommandBusService` extends `CommandBus<DomainCommandsMap>` and is the single dispatch point from controllers into the domain.

### Adding a new DB entity — required steps

1. Add types in `backend/database/src/types/`
2. Add schema in `backend/database/src/schemas/`
3. Add model in `backend/database/src/models/`
4. Export from `backend/database/src/index.ts`
5. Add a matching plain-TS entity interface in `backend/domain/src/entities/`
6. Add a mapper function in `backend/api/src/mappers/` that converts the Mongoose document to the domain entity
7. Create and run a migration: `bun run migrate:create` → `bun run migrate:up`

### Demo Parser (Go)

`backend/demo-composer/` is a Go package that parses CS2 `.dem` files into per-frame JSON chunks stored in MongoDB with configurable chunk sizes (default 1000 frames). The compiled binary (`main.bin`) is invoked by the Bun API via `ParserRepository`.

### Frontend

`frontend/demo-viewer/` is a React 19 + Vite SPA. The 3D map viewer uses `@react-three/fiber` + `@react-three/drei` with an orthographic top-down camera. Map radar textures are served from `backend/storage/map/<map_name>/`.

### Database

MongoDB via Mongoose. The `@demo-viewer/database` package owns all schemas, models, and the connection helper. Migrations live in `backend/database/migrations/` and use `migrate-mongo`.

## Key Conventions

- New domain operations require: a Command, a Handler, and registration in `backend/domain/src/handlers/index.ts` (auto-wired by `buildOperations`).
- The API's OpenAPI docs are auto-generated by `@elysiajs/openapi` and served at `http://localhost:<port>/openapi`.
- Alsways duplicate your plans in `docs/plans`
