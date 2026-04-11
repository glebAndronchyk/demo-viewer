# Storage Abstraction

## Overview

Map assets (radar images, layer overlays) are served through a provider-agnostic storage layer. The underlying storage can be swapped between local filesystem and remote object storage (S3, Azure Blob, GCS) without any changes to the API surface or domain logic.

## Endpoint

```
GET /storage/static/map/:mapId/:layer
```

| Parameter | Description                                     |
|-----------|-------------------------------------------------|
| `mapId`   | Map identifier (e.g. `de_dust2`)                |
| `layer`   | Asset layer filename without extension (e.g. `radar`, `preview`) |

The resolved file path is: `{storageLocalBasePath}/maps/{mapId}/{layer}`

### Response

- **Local adapter** — streams the file directly with the correct `Content-Type`
- **Remote adapter** — issues a `302` redirect to a pre-signed or CDN URL; the client fetches bytes directly from object storage

---

## Architecture

### Port

`StorageOutboundPort` (`backend/domain/src/ports/outbound/StorageOutboundPort.ts`) defines the storage contract used by the domain:

```typescript
interface StorageOutboundPort {
  getAsset(objectPath: string): Promise<string | StreamAssetResponse | null>;
  streamAsset(objectPath: string): Promise<StreamAssetResponse | null>;
  resolveAssetUrl(objectPath: string): Promise<string>;
  ls(path: string): Promise<string[]>;
  readonly usesRedirect: boolean;
}
```

`getAsset` is the primary method for callers. It returns:
- `string` — a redirect URL (when `usesRedirect` is `true`)
- `StreamAssetResponse` — a lazy stream + content-type (when `usesRedirect` is `false`)
- `null` — asset not found

### Adapters

| Adapter | Location | `usesRedirect` | Behavior |
|---------|----------|----------------|----------|
| `LocalFilesystemStorageAdapter` | `adapters/LocalFilesystemStorageAdapter.ts` | `false` | Reads from local disk via `Bun.file()` |
| _(future)_ S3 / Azure / GCS | `adapters/*StorageAdapter.ts` | `true` | Returns pre-signed URL, client fetches from CDN |

The active adapter is instantiated in `index.ts` based on the `STORAGE_TYPE` environment variable and passed into the DI container.

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_TYPE` | `local` | Which adapter to use (`local`, `s3`, `azure`, `gcs`) |
| `STORAGE_LOCAL_BASE_PATH` | `./storage/assets` | Root directory for the local adapter |

`getMapRadarFileAssetsPath(mapId)` on `ConfigurationInboundPort` resolves the full base path for a given map's assets.

---

## Data flow

```
Client
  │
  │  GET /storage/static/map/de_dust2/radar
  ▼
StorageController
  │  dispatches GetMapRadarAssetsCommand { mapId, layer }
  ▼
GetMapRadarAssetsCommandHandler
  │  builds path via configuration.getMapRadarFileAssetsPath(mapId) + "/" + layer
  │  calls outbound.fileStorage.getAsset(path)
  ▼
StorageOutboundPort (adapter)
  │
  ├─ local  → StreamAssetResponse { stream(), preflight.contentType }
  └─ remote → string (redirect URL)
  │
  ▼
StorageController
  ├─ string        → 302 redirect to URL
  └─ StreamAsset   → Response with streamed bytes + Content-Type
```

---

## Adding a new storage provider

1. Implement `StorageOutboundPort` in `adapters/`
2. Set `usesRedirect = true` and implement `resolveAssetUrl` to return a pre-signed or CDN URL
3. Update `index.ts` to instantiate the new adapter when `STORAGE_TYPE` matches
4. No changes needed to the domain, handler, or controller