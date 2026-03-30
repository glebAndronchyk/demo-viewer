import { Document } from 'mongoose';

export interface IUser {
  steam_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}
