import mongoose, { Model } from 'mongoose';
import {
  IGroupDocument,
  IGroupMemberDocument,
  IAssetDocument,
  IMapDocument,
  IMapSectorDocument,
} from '../types/core.types';
import {
  GroupSchema,
  GroupMemberSchema,
  AssetSchema,
  MapSchema,
  MapSectorSchema,
} from '../schemas/core.schema';

export const GroupModel: Model<IGroupDocument> =
  mongoose.models.Group || mongoose.model<IGroupDocument>('Group', GroupSchema);

export const GroupMemberModel: Model<IGroupMemberDocument> =
  mongoose.models.GroupMember ||
  mongoose.model<IGroupMemberDocument>('GroupMember', GroupMemberSchema);

export const AssetModel: Model<IAssetDocument> =
  mongoose.models.Asset || mongoose.model<IAssetDocument>('Asset', AssetSchema);

export const MapModel: Model<IMapDocument> =
  mongoose.models.Map || mongoose.model<IMapDocument>('Map', MapSchema);

export const MapSectorModel: Model<IMapSectorDocument> =
  mongoose.models.MapSector ||
  mongoose.model<IMapSectorDocument>('MapSector', MapSectorSchema);
