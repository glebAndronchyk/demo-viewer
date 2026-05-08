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
    const { page } = command;

    const take = outbound.configuration.matchesPageSize;
    const skip = (page - 1) * outbound.configuration.matchesPageSize;

    const totalMatches = await outbound.matchRepository.getTotalMatches();
    const matches = await outbound.matchRepository.getMatches(skip, take);

    return {
      totalPages: Math.ceil(totalMatches / take),
      page: matches.map(
        (m) =>
          ({
            map: m.mapName,
            demoId: m.demoId,
            players: m.participants.map(
              (p) =>
                ({
                  name: p.playerName,
                  steamId: p.steamId || "",
                  avatar: "",
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
