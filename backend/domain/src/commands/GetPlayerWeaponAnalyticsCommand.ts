import type { GenericCommand } from "../lib/command_bus";
import type { PlayerWeaponsUsageEntity } from "../entities/PlayerWeaponsUsageEntity.ts";
import type { PlayerWeaponStatsEntity } from "../entities/PlayerWeaponStatsEntity.ts";
import type { PlayerUtilityEntity } from "../entities/PlayerUtilityEntity.ts";

export interface GetPlayerWeaponAnalyticsCommand
  extends GenericCommand<"get_player_weapon_analytics"> {
  steamId: string;
  startDate: Date;
}

export interface GetPlayerWeaponAnalyticsCommandResult {
  weaponUsagePct: PlayerWeaponsUsageEntity;
  weaponStats: PlayerWeaponStatsEntity;
  utilityUsage: Omit<PlayerUtilityEntity, "statsId">;
}