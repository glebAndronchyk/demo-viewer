import { Document, Types } from 'mongoose';

export interface IPlayerStats {
  participant_steam_id: string;
  total_kills?: number;
  total_deaths?: number;
  total_utility_damage?: Types.Decimal128;
  total_adr?: Types.Decimal128;
  total_mvps?: number;
  total_hs?: Types.Decimal128;
  total_assists?: number;
  total_kpr?: Types.Decimal128;
  total_apr?: Types.Decimal128;
  total_score?: number;
  match_id?: Types.ObjectId;
  total_rounds_played?: number;
  date_recorded?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlayerStatsDocument extends IPlayerStats, Document {}
