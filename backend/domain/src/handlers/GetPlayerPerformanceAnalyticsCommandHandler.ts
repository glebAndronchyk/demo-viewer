import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetPlayerPerformanceAnalyticsCommand,
  GetPlayerPerformanceAnalyticsCommandResult,
} from "../commands/GetPlayerPerformanceAnalyticsCommand.ts";

export const getPlayerPerformanceAnalyticsHandler = (
  outbound: DomainOutbound,
) => {
  const handler: GenericCommandHandler<
    GetPlayerPerformanceAnalyticsCommand,
    GetPlayerPerformanceAnalyticsCommandResult
  > = async (command) => {
    const [accuracy, clutches] = await Promise.all([
      outbound.matchRepository.aggregateAccuracy(
        command.steamId,
        command.startDate,
      ),
      outbound.matchRepository.aggregateClutches(
        command.steamId,
        command.startDate,
      ),
    ]);

    return {
      accuracy,
      clutches,
    };
  };

  handler.match = (c: object): c is GetPlayerPerformanceAnalyticsCommand =>
    "type" in c &&
    c.type ===
      ("get_player_performance_analytics" satisfies GetPlayerPerformanceAnalyticsCommand["type"]);

  return handler;
};

export const getPlayerPerformanceAnalyticsRegistration = createRegistration<
  GetPlayerPerformanceAnalyticsCommand,
  GetPlayerPerformanceAnalyticsCommandResult
>("get_player_performance_analytics", getPlayerPerformanceAnalyticsHandler);

export default getPlayerPerformanceAnalyticsRegistration;
