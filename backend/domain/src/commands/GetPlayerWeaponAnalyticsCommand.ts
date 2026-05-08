import type { GenericCommand } from "../lib/command_bus";
import type { PlayerWeaponsUsageEntity } from "../entities/PlayerWeaponsUsageEntity.ts";
import type { PlayerWeaponStatsEntity } from "../entities/PlayerWeaponStatsEntity.ts";

export interface GetPlayerWeaponAnalyticsCommand
  extends GenericCommand<"get_player_weapon_analytics"> {
  steamId: string;
  startDate: Date;
}

export interface GetPlayerWeaponAnalyticsCommandResult {
  weaponUsagePct: PlayerWeaponsUsageEntity;
  weaponStats: PlayerWeaponStatsEntity;
}