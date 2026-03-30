import { Document, Types } from 'mongoose';

export interface IUtilitySchema {
  stats_id: string;
  grenades_thrown?: number;
  he_thrown?: number;
  smokes_thrown?: number;
  molotovs_thrown?: number;
  flashes_thrown?: number;
  incendiaries_thrown?: number;
  teammates_flashed?: number;
  utility_damage?: number;
  utility_value?: number;
  enemies_flashed?: number;
  flash_duration?: Types.Decimal128;
  date_recorded?: Date;
}

export interface IUtilitySchemaDocument extends IUtilitySchema, Document {}

export interface IPositionsStats {
  stats_id: string;
  sector_id?: string;
  time_spent_sec?: Types.Decimal128;
  kills_from?: number;
  deaths_at?: number;
  rounds_played?: number;
  date_recorded?: Date;
}

export interface IPositionsStatsDocument extends IPositionsStats, Document {}
