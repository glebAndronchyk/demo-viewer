import { basename } from "node:path";

import { join } from "path";
import type {
  StorageOutboundPort,
  StreamAssetResponse,
} from "@demo-viewer/domain/src/ports/outbound/StorageOutboundPort";
import type { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import { Glob } from "bun";

export class LocalFilesystemStorageAdapter implements StorageOutboundPort {
  readonly usesRedirect = false;

  constructor(private readonly config: ConfigurationInboundPort) {}

  async lsMapRadar(
    path: string,
    transform?: (p: string) => string,
  ): Promise<Record<number | "buyzones", string>> {
    const layers = await this.ls(path);

    const namedGroups = layers.map((l) => [
      basename(l).replaceAll(/\.[^.]*$/g, ""),
      transform?.(l) || l,
    ]);

    return Object.fromEntries(namedGroups);
  }

  ls(path: string): Promise<string[]> {
    const scanGlob = new Glob(
      join(this.config.storageLocalBasePath, path, "*"),
    );

    const iterator = scanGlob.scanSync();

    return Promise.resolve(Array.from(iterator));
  }

  getAsset(objectPath: string): Promise<string | StreamAssetResponse | null> {
    if (this.usesRedirect) {
      return this.resolveAssetUrl(objectPath);
    } else {
      return this.streamAsset(objectPath);
    }
  }

  async streamAsset(objectPath: string): Promise<StreamAssetResponse | null> {
    const file = Bun.file(join(this.config.storageLocalBasePath, objectPath));
    const exists = await file.exists();

    if (!exists) return null;

    return {
      preflight: {
        contentType: file.type,
      },
      stream: () => file.stream(),
    } satisfies StreamAssetResponse;
  }

  async resolveAssetUrl(_objectPath: string): Promise<string> {
    throw new Error(
      "resolveAssetUrl is not supported by LocalFilesystemStorageAdapter",
    );
  }
}
