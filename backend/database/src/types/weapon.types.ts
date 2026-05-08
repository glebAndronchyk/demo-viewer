import { Document, Types } from 'mongoose';

export interface IPlayerWeaponsUsage {
  stats_id: Types.ObjectId;
  pistols_pct?: Types.Decimal128;
  utility_pct?: Types.Decimal128;
  melee_pct?: Types.Decimal128;
  shotguns_pct?: Types.Decimal128;
  smg_pct?: Types.Decimal128;
  assault_rifle_pct?: Types.Decimal128;
  sniper_rifles_pct?: Types.Decimal128;
  machine_guns_pct?: Types.Decimal128;
}

export interface IPlayerWeaponsUsageDocument extends IPlayerWeaponsUsage, Document {}

export interface IWeaponStats {
  player_weapon_usage_id: Types.ObjectId;
  weapon_name: string;
  kills?: number;
  deaths?: number;
  hits?: number;
  shots?: number;
  damage?: number;
  headshots?: number;
}

export interface IWeaponStatsDocument extends IWeaponStats, Document {}
