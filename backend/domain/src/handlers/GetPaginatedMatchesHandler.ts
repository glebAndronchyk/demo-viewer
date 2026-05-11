import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetPaginatedMatchesCommand,
  GetPaginatedMatchesCommandResult,
} from "../commands/GetPaginatedMatchesCommand.ts";
export const getPaginatedMatchesHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetPaginatedMatchesCommand,
    GetPaginatedMatchesCommandResult
  > = async (command) => {
    const { page, steamIds: filterSteamIds } = command;

    const take = outbound.configuration.matchesPageSize;
    const skip = (page - 1) * outbound.configuration.matchesPageSize;

    const [totalMatches, matches] = await Promise.all([
      outbound.matchRepository.getTotalMatches(filterSteamIds),
      outbound.matchRepository.getMatches(skip, take, filterSteamIds),
    ]);

    const steamIds = [
      ...new Set(
        matches
          .flatMap((m) => m.participants.map((p) => p.steamId))
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const summaries =
      await outbound.steamUserRepository.getPlayerSummaries(steamIds);
    const avatarMap = new Map(summaries.map((s) => [s.steamId, s.avatarUrl]));

    return {
      totalItems: totalMatches,
      pageSize: outbound.configuration.matchesPageSize,
      totalPages: Math.ceil(totalMatches / take),
      page: matches.map(
        (m) =>
          ({
            map: m.mapName,
            demoId: m.demoId,
            matchId: m.id,
            players: m.participants.map(
              (p) =>
                ({
                  name: p.playerName,
                  steamId: p.steamId || "",
                  avatar: avatarMap.get(p.steamId ?? "") ?? "",
                }) satisfies GetPaginatedMatchesCommandResult["page"][number]["players"][number],
            ),
            outcome: {
              totalRounds: m.rounds.length,
              ctWins: m.outcome.ctScore,
              tWins: m.outcome.tScore,
              winner: m.outcome.winner as "CT" | "T" | "Draw",
            },
          }) satisfies GetPaginatedMatchesCommandResult["page"][number],
      ),
    };
  };

  handler.match = (c: object): c is GetPaginatedMatchesCommand =>
    "type" in c &&
    c.type ===
      ("get_paginated_matchers" satisfies GetPaginatedMatchesCommand["type"]);

  return handler;
};

export const getPaginatedMatchesRegistration = createRegistration<
  GetPaginatedMatchesCommand,
  GetPaginatedMatchesCommandResult
>("get_paginated_matchers", getPaginatedMatchesHandler);

export default getPaginatedMatchesRegistration;
