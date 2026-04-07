import { Document } from "mongoose";

export interface IUser {
  steam_id: string;
  steam_id_key: string;
  latest_known_share_code?: string | null;
  initial_known_share_code?: string | null;
  share_code_verified_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}
