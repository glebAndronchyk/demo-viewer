import { IPlayerStats } from "@demo-viewer/database/dist/types/player_stats.types";
import { PlayerStatsEntity } from "@demo-viewer/domain/src/entities/PlayerStatsEntity";
import { Types } from "mongoose";

function decimal128ToNumber(value?: Types.Decimal128): number | undefined {
  return value != null ? parseFloat(value.toString()) : undefined;
}

export function toPlayerStatsEntity(doc: IPlayerStats): PlayerStatsEntity {
  return {
    participantSteamId: doc.participant_steam_id,
    matchId: doc.match_id,
    totalKills: doc.total_kills,
    totalDeaths: doc.total_deaths,
    totalAssists: doc.total_assists,
    totalMvps: doc.total_mvps,
    totalScore: doc.total_score,
    totalRoundsPlayed: doc.total_rounds_played,
    totalUtilityDamage: decimal128ToNumber(doc.total_utility_damage),
    totalAdr: decimal128ToNumber(doc.total_adr),
    totalHs: decimal128ToNumber(doc.total_hs),
    totalKpr: decimal128ToNumber(doc.total_kpr),
    totalApr: decimal128ToNumber(doc.total_apr),
    totalDpr: decimal128ToNumber(doc.total_dpr),
    dateRecorded: doc.date_recorded,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}