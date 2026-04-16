export interface PlayerStatsEntity {
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