import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetPlayerWeaponAnalyticsCommand,
  GetPlayerWeaponAnalyticsCommandResult,
} from "../commands/GetPlayerWeaponAnalyticsCommand.ts";

function grenadeSuccessRate(damage: number, thrown: number): number {
  if (!thrown) return 0;
  const avg = damage / thrown;
  if (avg >= 30) return 1;
  if (avg >= 15) return 0.66;
  if (avg >= 5) return 0.33;
  return 0;
}

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

    const flashSuccessRate = utilityUsage.flashesThrown
      ? (utilityUsage.enemiesFlashed ?? 0) / utilityUsage.flashesThrown
      : 0;

    const heSuccessRate = grenadeSuccessRate(
      utilityUsage.heDamage ?? 0,
      utilityUsage.heThrown ?? 0,
    );

    const fireThrown =
      (utilityUsage.molotovsThrown ?? 0) +
      (utilityUsage.incendiariesThrown ?? 0);
    const fireSuccessRate = grenadeSuccessRate(
      utilityUsage.molotovsDamage ?? 0,
      fireThrown,
    );

    return {
      weaponUsagePct,
      weaponStats,
      utilityUsage: { ...utilityUsage, flashSuccessRate, heSuccessRate, fireSuccessRate },
    };
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
