import { Schema } from 'mongoose';
import { IMatchDocument } from '../types/match.types';

const ParticipantSchema = new Schema(
  {
    steam_id: {
      type: String,
      trim: true,
    },
    user_id: {
      type: String,
      trim: true,
    },
    player_name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

export const MatchSchema = new Schema<IMatchDocument>(
  {
    date_uploaded: {
      type: Date,
      required: true,
    },
    date_played: {
      type: Date,
      required: true,
    },
    chunk_count: {
      type: Number,
      required: true,
      min: 0,
    },
    participants: {
      type: [ParticipantSchema],
      required: true,
      default: [],
    },
    map_id: {
      type: String,
      required: true,
      trim: true,
    },
    visible_for_all: {
      type: Boolean,
      required: true,
      default: false,
    },
    group_id: {
      type: String,
      trim: true,
      default: null,
    },
    crawled: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'matches',
  }
);

// Indexes
MatchSchema.index({ date_played: -1 });
MatchSchema.index({ date_uploaded: -1 });
MatchSchema.index({ 'participants.steam_id': 1 });
MatchSchema.index({ 'participants.user_id': 1 });
MatchSchema.index({ map_id: 1 });
MatchSchema.index({ group_id: 1 });
