import type { ApiSuccessResponse } from "../common/ApiResponse.ts";

export interface PlayerStatsDto {
  participantSteamId: string;
  matchId?: string;
  totalKills?: number;
  totalDeaths?: number;
  totalAssists?: number;
  totalMvps?: number;
  totalScore?: number;
  totalRoundsPlayed?: number;
  totalUtilityDamage?: number;
  totalAdr?: number;
  totalHs?: number;
  totalKpr?: number;
  totalApr?: number;
  dateRecorded?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeaponStatsEntryDto {
  weaponName: string;
  kills: number;
  deaths: number;
  hits: number;
  shots: number;
  damage: number;
  headshots: number;
}

export interface PlayerWeaponStatsDto {
  statsId: string;
  weapons: WeaponStatsEntryDto[];
  dateRecorded?: string;
}

export interface PlayerWeaponsUsageDto {
  statsId: string;
  pistolsPct: number;
  utilityPct: number;
  meleePct: number;
  shotgunsPct: number;
  smgPct: number;
  assaultRiflePct: number;
  sniperRiflePct: number;
  machineGunPct: number;
  dateRecorded?: string;
  _analyticsType: string;
}

export interface PlayerUtilityDto {
  grenadesThrown?: number;
  heThrown?: number;
  smokesThrown?: number;
  molotovsThrown?: number;
  flashesThrown?: number;
  incendiariesThrown?: number;
  teammatesFlashed?: number;
  molotovsDamage?: number;
  heDamage?: number;
  enemiesFlashed?: number;
  flashDuration?: number;
  flashSuccessRate?: number;
  heSuccessRate?: number;
  fireSuccessRate?: number;
  dateRecorded?: string;
}

export interface PlayerEconomyDto {
  roundsEco?: number;
  roundsForceBuy?: number;
  roundsFullBuy?: number;
  roundsPistol?: number;
  roundsEcoWon?: number;
  dateRecorded?: string;
}

export interface WeaponAnalyticsResponseData {
  weaponUsagePct: PlayerWeaponsUsageDto;
  weaponStats: PlayerWeaponStatsDto;
  utilityUsage: PlayerUtilityDto;
}

export interface EconomyAnalyticsResponseData {
  economyUsage: PlayerEconomyDto;
}

export type MatchPlayerStatsResponseDto = ApiSuccessResponse<PlayerStatsDto>;
export type TotalPlayerStatsResponseDto = ApiSuccessResponse<PlayerStatsDto>;
export type WeaponAnalyticsResponseDto =
  ApiSuccessResponse<WeaponAnalyticsResponseData>;
export type EconomyAnalyticsResponseDto =
  ApiSuccessResponse<EconomyAnalyticsResponseData>;
