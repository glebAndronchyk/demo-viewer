import { Schema } from 'mongoose';
import { IUserDocument } from '../types/user.types';

export const UserSchema = new Schema<IUserDocument>(
  {
    steam_id: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indexes
UserSchema.index({ steam_id: 1 }, { unique: true });
