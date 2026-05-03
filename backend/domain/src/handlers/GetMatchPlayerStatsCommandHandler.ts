import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import { DomainNotFoundError } from "../lib/errors/DomainErrors.ts";
import { MatchPlayerStatsCalculator } from "../operations/analytics/MatchPlayerStatsCalculator.ts";
import type {
  GetMatchPlayerStatsCommand,
  GetMatchPlayerStatsCommandResult,
} from "../commands/GetMatchPlayerStatsCommand.ts";

export const getMatchPlayerStatsHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetMatchPlayerStatsCommand,
    GetMatchPlayerStatsCommandResult
  > = async (command) => {
    let stats = await outbound.matchRepository.getMatchPlayerStats(
      command.matchId,
      command.steamId,
    );

    if (!stats) {
      const calc = new MatchPlayerStatsCalculator(
        command.matchId,
        command.steamId,
        outbound.matchRepository,
      );
      stats = await calc.calculate();
    }

    if (!stats) {
      throw new DomainNotFoundError(
        `Stats not found for player ${command.steamId} in match ${command.matchId}`,
      );
    }

    return { stats };
  };

  handler.match = (c: object): c is GetMatchPlayerStatsCommand =>
    "type" in c &&
    c.type === ("get_match_player_stats" satisfies GetMatchPlayerStatsCommand["type"]);

  return handler;
};

export const getMatchPlayerStatsRegistration = createRegistration<
  GetMatchPlayerStatsCommand,
  GetMatchPlayerStatsCommandResult
>("get_match_player_stats", getMatchPlayerStatsHandler);

export default getMatchPlayerStatsRegistration;
