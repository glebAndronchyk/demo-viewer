import { IPlayerStats } from "@demo-viewer/database/dist/types/player_stats.types";
import { PlayerStatsEntity } from "@demo-viewer/domain/src/entities/PlayerStatsEntity";
import { Types } from "mongoose";

function decimal128ToNumber(value?: Types.Decimal128): number | undefined {
  return value != null ? parseFloat(value.toString()) : undefined;
}

export function toPlayerStatsEntity(doc: IPlayerStats): PlayerStatsEntity {
  return {
    _analyticsType: "stats",
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
    dateRecorded: doc.date_recorded,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toPlayerStatsModel(entity: PlayerStatsEntity): IPlayerStats {
  return {
    participant_steam_id: entity.participantSteamId,
    match_id: entity.matchId,
    total_kills: entity.totalKills,
    total_deaths: entity.totalDeaths,
    total_assists: entity.totalAssists,
    total_mvps: entity.totalMvps,
    total_score: entity.totalScore,
    total_rounds_played: entity.totalRoundsPlayed,
    total_utility_damage: entity.totalUtilityDamage as unknown as Types.Decimal128,
    total_adr: entity.totalAdr as unknown as Types.Decimal128,
    total_hs: entity.totalHs as unknown as Types.Decimal128,
    total_kpr: entity.totalKpr as unknown as Types.Decimal128,
    total_apr: entity.totalApr as unknown as Types.Decimal128,
    date_recorded: entity.dateRecorded,
    createdAt: entity.createdAt ?? new Date(),
    updatedAt: entity.updatedAt ?? new Date(),
  };
}