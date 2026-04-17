import type {
  IPlayerAccuracy,
  IPlayerClutches,
  IPlayerEconomy,
  IPlayerUtility,
  IPlayerWeaponsUsage,
  IWeaponStats,
} from "@demo-viewer/database";
import { Types } from "mongoose";
import type { PlayerClutchesEntity } from "@demo-viewer/domain/src/entities/PlayerClutchesEntity";
import type { PlayerEconomyEntity } from "@demo-viewer/domain/src/entities/PlayerEconomyEntity";
import type { PlayerUtilityEntity } from "@demo-viewer/domain/src/entities/PlayerUtilityEntity";
import type { PlayerWeaponsUsageEntity } from "@demo-viewer/domain/src/entities/PlayerWeaponsUsageEntity";
import type { PlayerWeaponStatsEntity } from "@demo-viewer/domain/src/entities/PlayerWeaponStatsEntity";
import type { PlayerAccuracyEntity } from "@demo-viewer/domain/src/entities/PlayerAccuracyEntity";

function numberToDecimal128(value?: number): Types.Decimal128 | undefined {
  return value as unknown as Types.Decimal128 | undefined;
}

export function toPlayerClutchesModel(entity: PlayerClutchesEntity): IPlayerClutches {
  return {
    stats_id: entity.statsId,
    clutch_1v1: entity.clutch1v1,
    clutch_1v2: entity.clutch1v2,
    clutch_1v3: entity.clutch1v3,
    clutch_1v4: entity.clutch1v4,
    clutch_1v5: entity.clutch1v5,
  };
}

export function toPlayerEconomyModel(entity: PlayerEconomyEntity): IPlayerEconomy {
  return {
    stats_id: entity.statsId,
    rounds_eco: entity.roundsEco,
    rounds_force_buy: entity.roundsForceBuy,
    rounds_full_buy: entity.roundsFullBuy,
    rounds_pistol: entity.roundsPistol,
    rounds_eco_won: entity.roundsEcoWon,
    date_recorded: entity.dateRecorded,
  };
}

export function toPlayerUtilityModel(entity: PlayerUtilityEntity): IPlayerUtility {
  return {
    stats_id: entity.statsId,
    grenades_thrown: entity.grenadesThrown,
    he_thrown: entity.heThrown,
    smokes_thrown: entity.smokesThrown,
    molotovs_thrown: entity.molotovsThrown,
    flashes_thrown: entity.flashesThrown,
    incendiaries_thrown: entity.incendiariesThrown,
    teammates_flashed: entity.teammatesFlashed,
    enemies_flashed: entity.enemiesFlashed,
    flash_duration: numberToDecimal128(entity.flashDuration),
    molotovs_damage: entity.molotovsDamage,
    he_damage: entity.heDamage,
    date_recorded: entity.dateRecorded,
  };
}

export function toPlayerWeaponsUsageModel(entity: PlayerWeaponsUsageEntity): IPlayerWeaponsUsage {
  return {
    stats_id: entity.statsId,
    pistols_pct: numberToDecimal128(entity.pistolsPct),
    utility_pct: numberToDecimal128(entity.utilityPct),
    melee_pct: numberToDecimal128(entity.meleePct),
    shotguns_pct: numberToDecimal128(entity.shotgunsPct),
    smg_pct: numberToDecimal128(entity.smgPct),
    assault_rifle_pct: numberToDecimal128(entity.assaultRiflePct),
    sniper_rifles_pct: numberToDecimal128(entity.sniperRiflePct),
    machine_guns_pct: numberToDecimal128(entity.machineGunPct),
  };
}

export function toPlayerAccuracyModel(entity: PlayerAccuracyEntity): IPlayerAccuracy {
  return {
    stats_id: entity.statsId,
    total_shots: entity.totalShots,
    total_hits: entity.totalHits,
    headshots: entity.headshots,
    top_level_accuracy: numberToDecimal128(entity.topLevelAccuracy),
    hit_breakdown: entity.hitBreakdown as IPlayerAccuracy["hit_breakdown"],
    date_recorded: entity.dateRecorded,
  };
}

export function toWeaponStatsModels(entity: PlayerWeaponStatsEntity, usageId: string): IWeaponStats[] {
  return entity.weapons.map((w) => ({
    player_weapon_usage_id: usageId,
    weapon_name: w.weaponName,
    kills: w.kills,
    deaths: w.deaths,
    hits: w.hits,
    shots: w.shots,
    damage: w.damage,
    headshots: w.headshots,
  }));
}
