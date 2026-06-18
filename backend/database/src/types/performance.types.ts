import { Document, Types } from 'mongoose';

export interface IHitBreakdown {
  head: number;
  chest: number;
  stomach: number;
  left_arm: number;
  right_arm: number;
  left_leg: number;
  right_leg: number;
  neck: number;
  generic: number;
  gear: number;
  unknown: number;
}

export interface IPlayerAccuracy {
  stats_id: Types.ObjectId;
  total_shots?: number;
  total_hits?: number;
  headshots?: number;
  top_level_accuracy?: Types.Decimal128;
  hit_breakdown?: IHitBreakdown;
  date_recorded?: Date;
}

export interface IPlayerAccuracyDocument extends IPlayerAccuracy, Document {}

export interface IPlayerReaction {
  stats_id: Types.ObjectId;
  avg_ttr?: Types.Decimal128;
  min_ttr?: Types.Decimal128;
  max_ttr?: Types.Decimal128;
  min_ttr_game_round?: number;
  max_ttr_game_round?: number;
  date_recorded?: Date;
}

export interface IPlayerReactionDocument extends IPlayerReaction, Document {}

export interface IPlayerBehavior {
  stats_id: Types.ObjectId;
  aggression_signal?: Types.Decimal128;
  lurking_signal?: Types.Decimal128;
  support_signal?: Types.Decimal128;
  avg_engagement_distance?: Types.Decimal128;
  avg_engagement_accuracy?: Types.Decimal128;
  role?: string;
  confidence?: Types.Decimal128;
  date_recorded?: Date;
}

export interface IPlayerBehaviorDocument extends IPlayerBehavior, Document {}

export interface IPlayerUtility {
  stats_id: Types.ObjectId;
  grenades_thrown?: number;
  he_thrown?: number;
  smokes_thrown?: number;
  molotovs_thrown?: number;
  flashes_thrown?: number;
  incendiaries_thrown?: number;
  teammates_flashed?: number;
  enemies_flashed?: number;
  flash_duration?: Types.Decimal128;
  molotovs_damage?: number;
  he_damage?: number;
  date_recorded?: Date;
}

export interface IPlayerUtilityDocument extends IPlayerUtility, Document {}
