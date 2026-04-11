import type { GenericCommand } from "../lib/command_bus";
import type { StreamAssetResponse } from "../ports/outbound/StorageOutboundPort.ts";

export interface GetMapRadarAssetsCommand extends GenericCommand<"get_map_radar_assets"> {
  mapId: string;
  layer: string;
}

export interface GetMapRadarAssetsCommandResult {
  asset: string | StreamAssetResponse;
}
