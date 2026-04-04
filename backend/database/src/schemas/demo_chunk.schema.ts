import { Schema } from 'mongoose';
import { IDemoChunkDocument } from '../types/demo_chunk.types';

const Vector2Schema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false }
);

const Vector3Schema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  { _id: false }
);

const EquipmentSchema = new Schema(
  {
    active_weapon: { type: String, required: true },
    weapons: { type: [String], required: true, default: [] },
    grenades: { type: [String], required: true, default: [] },
  },
  { _id: false }
);

const PlayerStateSchema = new Schema(
  {
    steam_id_64: { type: String, required: true },
    name: { type: String, required: true },
    user_id: { type: Number, required: true },
    team: { type: String, required: true },
    position: { type: Vector3Schema, required: true },
    view_direction: { type: Vector2Schema, required: true },
    velocity: { type: Vector3Schema, required: true },
    hp: { type: Number, required: true },
    armor: { type: Number, required: true },
    has_helmet: { type: Boolean, required: true },
    has_defuse_kit: { type: Boolean, required: true },
    money: { type: Number, required: true },
    current_equipment: { type: EquipmentSchema, required: true },
    is_alive: { type: Boolean, required: true },
    is_bot: { type: Boolean, required: true },
    is_connected: { type: Boolean, required: true },
    is_ducking: { type: Boolean, required: true },
    is_defusing: { type: Boolean, required: true },
    is_planting: { type: Boolean, required: true },
    is_reloading: { type: Boolean, required: true },
    is_scoped: { type: Boolean, required: true },
    is_walking: { type: Boolean, required: true },
    flash_duration: { type: Number, required: true },
    kills: { type: Number, required: true },
    deaths: { type: Number, required: true },
    assists: { type: Number, required: true },
    score: { type: Number, required: true },
    mvps: { type: Number, required: true },
  },
  { _id: false }
);

const GameStateSchema = new Schema(
  {
    round_number: { type: Number, required: true },
    phase: { type: String, required: true },
    ct_score: { type: Number, required: true },
    t_score: { type: Number, required: true },
    time_remaining: { type: Number, required: true },
    bomb_planted: { type: Boolean, required: true },
    bomb_site: { type: String },
    bomb_time_remaining: { type: Number, required: true },
  },
  { _id: false }
);

const EventSchema = new Schema(
  {
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ReconnectionSchema = new Schema(
  {
    steam_id_64: { type: String, required: true },
    name: { type: String, required: true },
    reconnect_type: { type: String, required: true },
  },
  { _id: false }
);

const FrameSchema = new Schema(
  {
    demo_tick: { type: Number, required: true },
    game_tick: { type: Number, required: true },
    timestamp: { type: Number, required: true },
    player_states: { type: [PlayerStateSchema], required: true, default: [] },
    game_state: { type: GameStateSchema, required: true },
    events: { type: [EventSchema], required: true, default: [] },
    reconnections: { type: [ReconnectionSchema] },
  },
  { _id: false }
);

export const DemoChunkSchema = new Schema<IDemoChunkDocument>(
  {
    message_type: { type: String, required: true },
    demo_id: { type: String, required: true, trim: true },
    chunk_index: { type: Number, required: true, min: 0 },
    start_tick: { type: Number, required: true },
    end_tick: { type: Number, required: true },
    start_game_tick: { type: Number, required: true },
    end_game_tick: { type: Number, required: true },
    frames: { type: [FrameSchema], required: true, default: [] },
  },
  {
    timestamps: true,
    collection: 'demo_chunks',
  }
);

// Indexes
DemoChunkSchema.index({ demo_id: 1 });
DemoChunkSchema.index({ demo_id: 1, chunk_index: 1 }, { unique: true });
DemoChunkSchema.index({ demo_id: 1, start_tick: 1, end_tick: 1 });
DemoChunkSchema.index({ 'frames.player_states.steam_id_64': 1 });
DemoChunkSchema.index({ 'frames.events.type': 1 });
