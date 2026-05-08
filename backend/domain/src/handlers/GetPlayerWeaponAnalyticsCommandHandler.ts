import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetPlayerWeaponAnalyticsCommand,
  GetPlayerWeaponAnalyticsCommandResult,
} from "../commands/GetPlayerWeaponAnalyticsCommand.ts";

export const getPlayerWeaponAnalyticsHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetPlayerWeaponAnalyticsCommand,
    GetPlayerWeaponAnalyticsCommandResult
  > = async (command) => {
    const [weaponUsagePct, weaponStats, utilityUsage] = await Promise.all([
      outbound.matchRepository.aggregateWeaponUsagePct(
        command.steamId,
        command.startDate,
      ),
      outbound.matchRepository.aggregateWeaponStats(
        command.steamId,
        command.startDate,
      ),
      outbound.matchRepository.aggregateUtilityUsage(
        command.steamId,
        command.startDate,
      ),
    ]);

    return { weaponUsagePct, weaponStats, utilityUsage };
  };

  handler.match = (c: object): c is GetPlayerWeaponAnalyticsCommand =>
    "type" in c &&
    c.type ===
      ("get_player_weapon_analytics" satisfies GetPlayerWeaponAnalyticsCommand["type"]);

  return handler;
};

export const getPlayerWeaponAnalyticsRegistration = createRegistration<
  GetPlayerWeaponAnalyticsCommand,
  GetPlayerWeaponAnalyticsCommandResult
>("get_player_weapon_analytics", getPlayerWeaponAnalyticsHandler);

export default getPlayerWeaponAnalyticsRegistration;
