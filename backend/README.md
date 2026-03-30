# Backend Packages

This directory contains the backend packages for the demo-viewer project.

## Package Structure

### `database/`
Shared database package containing:
- MongoDB connection logic
- Mongoose schemas
- Mongoose models
- TypeScript types

All backend applications should import from this package to ensure consistency.

### `migrations/`
Database migrations package using migrate-mongo.

## Getting Started

### Prerequisites
- MongoDB running locally or accessible via connection string
- Node.js and pnpm installed

### Setup

1. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your MongoDB connection details**
   ```
   MONGODB_URI=mongodb://localhost:27017/demo-viewer
   MONGODB_DATABASE=demo-viewer
   ```

3. **Install dependencies** (from project root)
   ```bash
   pnpm install
   ```

4. **Build packages** (from project root)
   ```bash
   pnpm build
   ```

## Working with Migrations

### Create a new migration
```bash
pnpm migrate:create
# Enter migration name when prompted
```

### Check migration status
```bash
pnpm migrate:status
```

### Run pending migrations
```bash
pnpm migrate:up
```

### Rollback last migration
```bash
pnpm migrate:down
```

## Adding New Schemas

1. Create types in `database/src/types/entity.types.ts`
2. Create schema in `database/src/schemas/entity.schema.ts`
3. Create model in `database/src/models/entity.model.ts`
4. Export from `database/src/index.ts`
5. Rebuild the database package: `pnpm --filter @demo-viewer/database build`
6. Create a migration: `pnpm migrate:create`
7. Edit the migration file in `migrations/migrations/`
8. Run the migration: `pnpm migrate:up`

## Using Database Package in Your App

```typescript
import {
  connectDatabase,
  UserModel,
  IUserDocument
} from '@demo-viewer/database';

// Connect to database
await connectDatabase({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/demo-viewer',
});

// Use models
const users = await UserModel.find();
```

## Development

### Build a specific package
```bash
pnpm --filter @demo-viewer/database build
pnpm --filter @demo-viewer/migrations build
```

### Watch mode (auto-rebuild on changes)
```bash
cd backend/database
pnpm watch
```

## Package Dependencies

- `@demo-viewer/migrations` depends on `@demo-viewer/database` (workspace dependency)
- Future backend apps will also depend on `@demo-viewer/database`
