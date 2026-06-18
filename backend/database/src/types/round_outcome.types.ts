import { Document, Types } from 'mongoose';

export interface IPlayerTrades {
  stats_id: string;
  traded_teammates?: number;
  times_left_alive?: number;
  date_recorded?: Date;
}

export interface IPlayerTradesDocument extends IPlayerTrades, Document {}

export interface IPlayerEconomy {
  stats_id: Types.ObjectId;
  rounds_eco?: number;
  rounds_force_buy?: number;
  rounds_full_buy?: number;
  rounds_pistol?: number;
  rounds_eco_won?: number;
  date_recorded?: Date;
}

export interface IPlayerEconomyDocument extends IPlayerEconomy, Document {}

export interface IClutchStat {
  attempted: number;
  won: number;
}

export interface IPlayerClutches {
  stats_id: Types.ObjectId;
  clutch_1v1?: IClutchStat;
  clutch_1v2?: IClutchStat;
  clutch_1v3?: IClutchStat;
  clutch_1v4?: IClutchStat;
  clutch_1v5?: IClutchStat;
}

export interface IPlayerClutchesDocument extends IPlayerClutches, Document {}
