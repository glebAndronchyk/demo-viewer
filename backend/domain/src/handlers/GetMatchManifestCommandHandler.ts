import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetMatchManifestCommand,
  GetMatchManifestCommandResult,
} from "../commands/GetMatchManifestCommand.ts";
import { DomainNotFoundError } from "../lib/errors/DomainErrors.ts";

export const getMatchManifestCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetMatchManifestCommand,
    GetMatchManifestCommandResult
  > = async (command) => {
    const matchResult = await outbound.matchRepository.findByMatchId(
      command.matchId,
    );

    if (!matchResult) {
      throw new DomainNotFoundError(
        `Match with id:${command.matchId} not found`,
      );
    }

    return {
      mapName: matchResult.mapName,
      mapServer: matchResult.serverName,
      participants: matchResult.participants.map((p) => ({
        name: p.playerName,
        steamId: p.steamId,
        userId: p.userId,
        isBot: p.isBot,
      })),
      round: [],
      outcome: [] as never,
      demoId: matchResult.demoId,
      tickRate: matchResult.tickRate,
      totalTicks: matchResult.playbackTicks,
    } satisfies GetMatchManifestCommandResult;
  };

  handler.match = (c: object): c is GetMatchManifestCommand => {
    return (
      "type" in c &&
      c.type ===
        ("get_match_manifest" satisfies GetMatchManifestCommand["type"])
    );
  };

  return handler;
};

export const getMatchManifestCommandRegistration = createRegistration<
  GetMatchManifestCommand,
  GetMatchManifestCommandResult
>("get_match_manifest", getMatchManifestCommandHandler);

export default getMatchManifestCommandRegistration;
