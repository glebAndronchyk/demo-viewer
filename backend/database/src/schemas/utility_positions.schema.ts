import { Schema } from "mongoose";
import {
  IUtilitySchemaDocument,
  IPositionsStatsDocument,
} from "../types/utility_positions.types";

export const UtilitySchemaSchema = new Schema<IUtilitySchemaDocument>(
  {
    stats_id: {
      type: String,
      required: false,
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
    utility_damage: {
      type: Number,
    },
    utility_value: {
      type: Number,
    },
    enemies_flashed: {
      type: Number,
    },
    flash_duration: {
      type: Schema.Types.Decimal128,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: "utility_schema",
  },
);

// Indexes
UtilitySchemaSchema.index({ stats_id: 1 });

export const PositionsStatsSchema = new Schema<IPositionsStatsDocument>(
  {
    stats_id: {
      type: String,
      required: true,
      trim: true,
    },
    sector_id: {
      type: String,
      trim: true,
    },
    time_spent_sec: {
      type: Schema.Types.Decimal128,
    },
    kills_from: {
      type: Number,
    },
    deaths_at: {
      type: Number,
    },
    rounds_played: {
      type: Number,
    },
    date_recorded: {
      type: Date,
    },
  },
  {
    timestamps: false,
    collection: "positions_stats",
  },
);

// Indexes
PositionsStatsSchema.index({ stats_id: 1 });
PositionsStatsSchema.index({ sector_id: 1 });
