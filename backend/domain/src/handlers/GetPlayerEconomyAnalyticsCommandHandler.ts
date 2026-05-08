import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetPlayerEconomyAnalyticsCommand,
  GetPlayerEconomyAnalyticsCommandResult,
} from "../commands/GetPlayerEconomyAnalyticsCommand.ts";

export const getPlayerEconomyAnalyticsHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetPlayerEconomyAnalyticsCommand,
    GetPlayerEconomyAnalyticsCommandResult
  > = async (command) => {
    const economyUsage = await outbound.matchRepository.aggregateEconomyUsage(
      command.steamId,
      command.startDate,
    );

    return { economyUsage };
  };

  handler.match = (c: object): c is GetPlayerEconomyAnalyticsCommand =>
    "type" in c &&
    c.type ===
      ("get_player_economy_analytics" satisfies GetPlayerEconomyAnalyticsCommand["type"]);

  return handler;
};

export const getPlayerEconomyAnalyticsRegistration = createRegistration<
  GetPlayerEconomyAnalyticsCommand,
  GetPlayerEconomyAnalyticsCommandResult
>("get_player_economy_analytics", getPlayerEconomyAnalyticsHandler);

export default getPlayerEconomyAnalyticsRegistration;
