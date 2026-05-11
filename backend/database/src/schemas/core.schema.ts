import { Schema, Types } from 'mongoose';
import {
  IGroupDocument,
  IGroupMemberDocument,
  IAssetDocument,
  IMapDocument,
  IMapSectorDocument,
} from '../types/core.types';

export const GroupSchema = new Schema<IGroupDocument>(
  {
    owner_id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    is_open: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'groups',
  }
);

// Indexes
GroupSchema.index({ owner_id: 1 });

const DimensionsSchema = new Schema(
  {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);

export const GroupMemberSchema = new Schema<IGroupMemberDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    group_id: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'group_members',
  }
);

// Indexes
GroupMemberSchema.index({ user_id: 1 });
GroupMemberSchema.index({ group_id: 1 });
GroupMemberSchema.index({ user_id: 1, group_id: 1 }, { unique: true });

export const AssetSchema = new Schema<IAssetDocument>(
  {
    path: {
      type: String,
      required: true,
      trim: true,
    },
    dimensions: {
      type: DimensionsSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'assets',
  }
);

// Indexes
AssetSchema.index({ path: 1 });

export const MapSchema = new Schema<IMapDocument>(
  {
    map_name: {
      type: String,
      required: true,
      trim: true,
    },
    asset_id: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'maps',
  }
);

// Indexes
MapSchema.index({ map_name: 1 }, { unique: true });
MapSchema.index({ asset_id: 1 });

const RectSchema = new Schema(
  {
    x1: { type: Schema.Types.Decimal128, required: true },
    y1: { type: Schema.Types.Decimal128, required: true },
    x2: { type: Schema.Types.Decimal128, required: true },
    y2: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

export const MapSectorSchema = new Schema<IMapSectorDocument>(
  {
    sector_name: {
      type: String,
      required: true,
      trim: true,
    },
    rect: {
      type: RectSchema,
      required: true,
    },
    map_id: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'map_sectors',
  }
);

// Indexes
MapSectorSchema.index({ map_id: 1 });
