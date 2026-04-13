import { Document } from 'mongoose';

export interface IGroup {
  owner_id: string;
  name: string;
  is_open: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupDocument extends IGroup, Document {}

export interface IGroupMember {
  user_id: string;
  group_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupMemberDocument extends IGroupMember, Document {}

export interface IDimensions {
  width: number;
  height: number;
}

export interface IAsset {
  path: string;
  dimensions: IDimensions;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssetDocument extends IAsset, Document {}

export interface IMap {
  map_name: string;
  asset_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMapDocument extends IMap, Document {}

export interface IRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IMapSector {
  sector_name: string;
  rect: IRect;
  map_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMapSectorDocument extends IMapSector, Document {}
