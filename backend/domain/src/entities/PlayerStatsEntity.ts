import type { PlayerAnalyticalEntity } from "./PlayerAnalyticalEntity.ts";

export interface PlayerStatsEntity extends PlayerAnalyticalEntity {
  _analyticsType: "stats";
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
  dateRecorded?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}