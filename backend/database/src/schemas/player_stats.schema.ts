import { Schema } from 'mongoose';
import { IPlayerStatsDocument } from '../types/player_stats.types';

export const PlayerStatsSchema = new Schema<IPlayerStatsDocument>(
  {
    participant_steam_id: {
      type: String,
      required: true,
      trim: true,
    },
    total_kills: {
      type: Number,
    },
    total_deaths: {
      type: Number,
    },
    total_utility_damage: {
      type: Schema.Types.Decimal128,
    },
    total_adr: {
      type: Schema.Types.Decimal128,
    },
    total_mvps: {
      type: Number,
    },
    total_hs: {
      type: Schema.Types.Decimal128,
    },
    total_assists: {
      type: Number,
    },
    total_kpr: {
      type: Schema.Types.Decimal128,
    },
    total_apr: {
      type: Schema.Types.Decimal128,
    },
    total_score: {
      type: Number,
    },
    match_id: {
      type: String,
      trim: true,
    },
    total_rounds_played: {
      type: Number,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'player_stats',
  }
);

// Indexes
PlayerStatsSchema.index({ participant_steam_id: 1 });
PlayerStatsSchema.index({ match_id: 1 });
PlayerStatsSchema.index({ date_recorded: -1 });
