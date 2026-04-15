import { Schema } from 'mongoose';
import {
  IPlayerAccuracyDocument,
  IPlayerReactionDocument,
  IPlayerBehaviorDocument,
  IPlayerUtilityDocument,
} from '../types/performance.types';

const HitBreakdownSchema = new Schema(
  {
    head: { type: Number },
    chest: { type: Number },
    stomach: { type: Number },
    arms: { type: Number },
    legs: { type: Number },
  },
  { _id: false }
);

export const PlayerAccuracySchema = new Schema<IPlayerAccuracyDocument>(
  {
    stats_id: {
      type: String,
      required: true,
      trim: true,
    },
    total_shots: {
      type: Number,
    },
    total_hits: {
      type: Number,
    },
    headshots: {
      type: Number,
    },
    top_level_accuracy: {
      type: Schema.Types.Decimal128,
    },
    hit_breakdown: {
      type: HitBreakdownSchema,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'player_accuracy',
  }
);

// Indexes
PlayerAccuracySchema.index({ stats_id: 1 });

export const PlayerReactionSchema = new Schema<IPlayerReactionDocument>(
  {
    stats_id: {
      type: String,
      required: true,
      trim: true,
    },
    avg_ttr: {
      type: Schema.Types.Decimal128,
    },
    min_ttr: {
      type: Schema.Types.Decimal128,
    },
    max_ttr: {
      type: Schema.Types.Decimal128,
    },
    min_ttr_game_round: {
      type: Number,
    },
    max_ttr_game_round: {
      type: Number,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'player_reaction',
  }
);

// Indexes
PlayerReactionSchema.index({ stats_id: 1 });

export const PlayerBehaviorSchema = new Schema<IPlayerBehaviorDocument>(
  {
    stats_id: {
      type: String,
      required: true,
      trim: true,
    },
    aggression_signal: {
      type: Schema.Types.Decimal128,
    },
    lurking_signal: {
      type: Schema.Types.Decimal128,
    },
    support_signal: {
      type: Schema.Types.Decimal128,
    },
    avg_engagement_distance: {
      type: Schema.Types.Decimal128,
    },
    avg_engagement_accuracy: {
      type: Schema.Types.Decimal128,
    },
    role: {
      type: String,
      trim: true,
    },
    confidence: {
      type: Schema.Types.Decimal128,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'player_behavior',
  }
);

// Indexes
PlayerBehaviorSchema.index({ stats_id: 1 });

export const PlayerUtilitySchema = new Schema<IPlayerUtilityDocument>(
  {
    stats_id: {
      type: String,
      required: true,
      trim: true,
    },
    grenades_thrown: {
      type: Number,
    },
    he_thrown: {
      type: Number,
    },
    smokes_thrown: {
      type: Number,
    },
    molotovs_thrown: {
      type: Number,
    },
    flashes_thrown: {
      type: Number,
    },
    incendiaries_thrown: {
      type: Number,
    },
    teammates_flashed: {
      type: Number,
    },
    enemies_flashed: {
      type: Number,
    },
    flash_duration: {
      type: Schema.Types.Decimal128,
    },
    molotovs_damage: {
      type: Number,
    },
    he_damage: {
      type: Number,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'player_utility',
  }
);

// Indexes
PlayerUtilitySchema.index({ stats_id: 1 });
