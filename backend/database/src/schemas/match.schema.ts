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
    is_bot: {
      type: Boolean,
      required: true,
      default: false,
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
    // Demo header metadata (from parser)
    demo_id: {
      type: String,
      required: true,
      default: '',
      trim: true,
    },
    map_name: {
      type: String,
      required: true,
      default: '',
      trim: true,
    },
    server_name: {
      type: String,
      required: true,
      default: '',
      trim: true,
    },
    client_name: {
      type: String,
      required: true,
      default: '',
      trim: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 0,
    },
    tick_rate: {
      type: Number,
      required: true,
      default: 0,
    },
    frame_rate: {
      type: Number,
      required: true,
      default: 0,
    },
    signon_length: {
      type: Number,
      required: true,
      default: 0,
    },
    playback_ticks: {
      type: Number,
      required: true,
      default: 0,
    },
    playback_frames: {
      type: Number,
      required: true,
      default: 0,
    },
    parsed_at: {
      type: String,
      required: true,
      default: '',
      trim: true,
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
MatchSchema.index({ demo_id: 1 }, { unique: true, sparse: true });
MatchSchema.index({ map_name: 1 });
