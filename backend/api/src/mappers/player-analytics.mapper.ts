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
    stats_id: new Types.ObjectId(entity.statsId),
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
    stats_id: new Types.ObjectId(entity.statsId),
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
    stats_id: new Types.ObjectId(entity.statsId),
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

export function toPlayerEconomyEntity(doc: IPlayerEconomy): Omit<PlayerEconomyEntity, "statsId"> {
  return {
    _analyticsType: "economy",
    roundsEco: doc.rounds_eco,
    roundsForceBuy: doc.rounds_force_buy,
    roundsFullBuy: doc.rounds_full_buy,
    roundsPistol: doc.rounds_pistol,
    roundsEcoWon: doc.rounds_eco_won,
    dateRecorded: doc.date_recorded,
  };
}

export function toPlayerUtilityEntity(doc: IPlayerUtility): Omit<PlayerUtilityEntity, "statsId"> {
  return {
    _analyticsType: "utility",
    grenadesThrown: doc.grenades_thrown,
    heThrown: doc.he_thrown,
    smokesThrown: doc.smokes_thrown,
    molotovsThrown: doc.molotovs_thrown,
    flashesThrown: doc.flashes_thrown,
    incendiariesThrown: doc.incendiaries_thrown,
    teammatesFlashed: doc.teammates_flashed,
    enemiesFlashed: doc.enemies_flashed,
    flashDuration: doc.flash_duration ? parseFloat(doc.flash_duration.toString()) : undefined,
    molotovsDamage: doc.molotovs_damage,
    heDamage: doc.he_damage,
    dateRecorded: doc.date_recorded,
  };
}

export function toPlayerWeaponsUsageEntity(doc: IPlayerWeaponsUsage): PlayerWeaponsUsageEntity {
  return {
    _analyticsType: "weaponsUsage",
    statsId: doc.stats_id?.toString(),
    pistolsPct: doc.pistols_pct ? parseFloat(doc.pistols_pct.toString()) : undefined,
    utilityPct: doc.utility_pct ? parseFloat(doc.utility_pct.toString()) : undefined,
    meleePct: doc.melee_pct ? parseFloat(doc.melee_pct.toString()) : undefined,
    shotgunsPct: doc.shotguns_pct ? parseFloat(doc.shotguns_pct.toString()) : undefined,
    smgPct: doc.smg_pct ? parseFloat(doc.smg_pct.toString()) : undefined,
    assaultRiflePct: doc.assault_rifle_pct ? parseFloat(doc.assault_rifle_pct.toString()) : undefined,
    sniperRiflePct: doc.sniper_rifles_pct ? parseFloat(doc.sniper_rifles_pct.toString()) : undefined,
    machineGunPct: doc.machine_guns_pct ? parseFloat(doc.machine_guns_pct.toString()) : undefined,
  };
}

export function toPlayerWeaponStatsEntity(
  usageDoc: IPlayerWeaponsUsage & { _id: unknown },
  statsDocs: IWeaponStats[],
): PlayerWeaponStatsEntity {
  return {
    _analyticsType: "weaponStats",
    statsId: usageDoc.stats_id?.toString(),
    weapons: statsDocs.map((w) => ({
      weaponName: w.weapon_name,
      kills: w.kills ?? 0,
      deaths: w.deaths ?? 0,
      hits: w.hits ?? 0,
      shots: w.shots ?? 0,
      damage: w.damage ?? 0,
      headshots: w.headshots ?? 0,
    })),
  };
}

export function toWeaponStatsModels(entity: PlayerWeaponStatsEntity, usageId: Types.ObjectId): IWeaponStats[] {
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
