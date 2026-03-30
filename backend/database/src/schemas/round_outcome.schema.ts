import { Schema } from 'mongoose';
import {
  IPlayerTradesDocument,
  IPlayerEconomyDocument,
  IPlayerClutchesDocument,
} from '../types/round_outcome.types';

export const PlayerTradesSchema = new Schema<IPlayerTradesDocument>(
  {
    stats_id: {
      type: String,
      required: true,
      trim: true,
    },
    traded_teammates: {
      type: Number,
    },
    times_left_alive: {
      type: Number,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'player_trades',
  }
);

// Indexes
PlayerTradesSchema.index({ stats_id: 1 });

export const PlayerEconomySchema = new Schema<IPlayerEconomyDocument>(
  {
    stats_id: {
      type: String,
      required: true,
      trim: true,
    },
    rounds_eco: {
      type: Number,
    },
    rounds_force_buy: {
      type: Number,
    },
    rounds_full_buy: {
      type: Number,
    },
    rounds_pistol: {
      type: Number,
    },
    rounds_eco_won: {
      type: Number,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: 'player_economy',
  }
);

// Indexes
PlayerEconomySchema.index({ stats_id: 1 });

const ClutchStatSchema = new Schema(
  {
    attempted: { type: Number },
    won: { type: Number },
  },
  { _id: false }
);

export const PlayerClutchesSchema = new Schema<IPlayerClutchesDocument>(
  {
    stats_id: {
      type: String,
      required: true,
      trim: true,
    },
    clutch_1v1: {
      type: ClutchStatSchema,
    },
    clutch_1v2: {
      type: ClutchStatSchema,
    },
    clutch_1v3: {
      type: ClutchStatSchema,
    },
    clutch_1v4: {
      type: ClutchStatSchema,
    },
    clutch_1v5: {
      type: ClutchStatSchema,
    },
  },
  {
    timestamps: false,
    collection: 'player_clutches',
  }
);

// Indexes
PlayerClutchesSchema.index({ stats_id: 1 });
