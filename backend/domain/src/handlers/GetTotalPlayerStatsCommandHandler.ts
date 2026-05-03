import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import { DomainNotFoundError } from "../lib/errors/DomainErrors.ts";
import type {
  GetTotalPlayerStatsCommand,
  GetTotalPlayerStatsCommandResult,
} from "../commands/GetTotalPlayerStatsCommand.ts";

export const getTotalPlayerStatsHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetTotalPlayerStatsCommand,
    GetTotalPlayerStatsCommandResult
  > = async (command) => {
    const stats = await outbound.matchRepository.getTotalPlayerStats(
      command.steamId,
    );

    if (!stats) {
      throw new DomainNotFoundError(
        `No stored stats found for player ${command.steamId}`,
      );
    }

    return { stats };
  };

  handler.match = (c: object): c is GetTotalPlayerStatsCommand =>
    "type" in c &&
    c.type === ("get_total_player_stats" satisfies GetTotalPlayerStatsCommand["type"]);

  return handler;
};

export const getTotalPlayerStatsRegistration = createRegistration<
  GetTotalPlayerStatsCommand,
  GetTotalPlayerStatsCommandResult
>("get_total_player_stats", getTotalPlayerStatsHandler);

export default getTotalPlayerStatsRegistration;
