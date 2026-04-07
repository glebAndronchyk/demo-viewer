import { Schema } from "mongoose";
import { IUserDocument } from "../types/user.types";

export const UserSchema = new Schema<IUserDocument>(
  {
    steam_id: {
      type: String,
      required: true,
      trim: true,
    },
    steam_id_key: {
      type: String,
      required: false,
      trim: false,
    },
    initial_known_share_code: {
      type: String,
      required: false,
      trim: false,
    },
    latest_known_share_code: {
      type: String,
      required: false,
      trim: false,
    },
    share_code_verified_at: {
      type: Date,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// Indexes
UserSchema.index({ steam_id: 1 }, { unique: true });
UserSchema.index(
  { latest_known_share_code: 1 },
  { unique: true, sparse: true },
);
