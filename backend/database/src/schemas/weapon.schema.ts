import { Schema } from "mongoose";
import {
  IPlayerWeaponsUsageDocument,
  IWeaponStatsDocument,
} from "../types/weapon.types";

export const PlayerWeaponsUsageSchema = new Schema<IPlayerWeaponsUsageDocument>(
  {
    stats_id: {
      type: String,
      required: false,
      trim: true,
    },
    pistols_pct: {
      type: Schema.Types.Decimal128,
    },
    utility_pct: {
      type: Schema.Types.Decimal128,
    },
    melee_pct: {
      type: Schema.Types.Decimal128,
    },
    shotguns_pct: {
      type: Schema.Types.Decimal128,
    },
    smg_pct: {
      type: Schema.Types.Decimal128,
    },
    assault_rifle_pct: {
      type: Schema.Types.Decimal128,
    },
    sniper_rifles_pct: {
      type: Schema.Types.Decimal128,
    },
    machine_guns_pct: {
      type: Schema.Types.Decimal128,
    },
  },
  {
    timestamps: false,
    collection: "player_weapons_usage",
  },
);

// Indexes
PlayerWeaponsUsageSchema.index({ stats_id: 1 });

export const WeaponStatsSchema = new Schema<IWeaponStatsDocument>(
  {
    player_weapon_usage_id: {
      type: String,
      required: false,
      trim: true,
    },
    weapon_name: {
      type: String,
      required: true,
      trim: true,
    },
    kills: {
      type: Number,
    },
    deaths: {
      type: Number,
    },
    hits: {
      type: Number,
    },
    shots: {
      type: Number,
    },
    damage: {
      type: Number,
    },
    headshots: {
      type: Number,
    },
  },
  {
    timestamps: false,
    collection: "weapon_stats",
  },
);

// Indexes
WeaponStatsSchema.index({ player_weapon_usage_id: 1 });
WeaponStatsSchema.index({ weapon_name: 1 });
