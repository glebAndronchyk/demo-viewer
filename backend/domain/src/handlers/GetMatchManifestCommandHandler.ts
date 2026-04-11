import { basename } from "node:path";

import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetMatchManifestCommand,
  GetMatchManifestCommandResult,
  ManifestRound,
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
    console.log(matchResult);
    if (!matchResult) {
      throw new DomainNotFoundError(
        `Match with id:${command.matchId} not found`,
      );
    }

    const radarLayers = await outbound.fileStorage
      .lsMapRadar(
        outbound.configuration.getMapRadarFileAssetsPath(matchResult.mapId),
        (layer) =>
          outbound.configuration.getMapRadarApiPath(
            matchResult.mapId,
            basename(layer),
          ),
      )
      .catch(() => {
        throw new DomainNotFoundError(
          `Map asset for id:${matchResult.mapId} not found`,
        );
      });

    return {
      mapRadarLayers: radarLayers,
      mapName: matchResult.mapName,
      mapServer: matchResult.serverName,
      participants: matchResult.participants.map((p) => ({
        name: p.playerName,
        steamId: p.steamId,
        userId: p.userId,
        isBot: p.isBot,
      })),
      rounds: matchResult.rounds.map(
        (r): ManifestRound => ({
          roundNumber: r.roundNumber,
          winner: r.winner,
          startDemoTick: r.startDemoTick,
          endDemoTick: r.endDemoTick,
          startGameTick: r.startGameTick,
          endGameTick: r.endGameTick,
        }),
      ),
      outcome: {
        winner: matchResult.outcome.winner,
        tScore: matchResult.outcome.tScore,
        ctScore: matchResult.outcome.ctScore,
      },
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
