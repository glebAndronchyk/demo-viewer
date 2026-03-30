import mongoose, { Model } from 'mongoose';
import { IUserDocument } from '../types/user.types';
import { UserSchema } from '../schemas/user.schema';

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
