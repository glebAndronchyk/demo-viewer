import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetMapRadarAssetsCommand,
  GetMapRadarAssetsCommandResult,
} from "../commands/GetMapRadarAssetsCommand.ts";
import { DomainNotFoundError } from "../lib/errors/DomainErrors.ts";

export const getMapRadarAssetsCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetMapRadarAssetsCommand,
    GetMapRadarAssetsCommandResult
  > = async (command) => {
    const path = `${outbound.configuration.getMapRadarFileAssetsPath(command.mapId)}/${command.layer}`;
    const asset = await outbound.fileStorage.getAsset(path);

    if (!asset) {
      throw new DomainNotFoundError(`Asset not found: ${path}`);
    }

    return { asset } satisfies GetMapRadarAssetsCommandResult;
  };

  handler.match = (c: object): c is GetMapRadarAssetsCommand => {
    return (
      "type" in c &&
      c.type ===
        ("get_map_radar_assets" satisfies GetMapRadarAssetsCommand["type"])
    );
  };

  return handler;
};

export const getMapRadarAssetsCommandRegistration = createRegistration<
  GetMapRadarAssetsCommand,
  GetMapRadarAssetsCommandResult
>("get_map_radar_assets", getMapRadarAssetsCommandHandler);

export default getMapRadarAssetsCommandRegistration;
