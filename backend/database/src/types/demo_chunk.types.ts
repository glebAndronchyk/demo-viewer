import { Document, Types } from 'mongoose';

export interface IVector2 {
  x: number;
  y: number;
}

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IEquipment {
  active_weapon: string;
  weapons: string[];
  grenades: string[];
}

export interface IPlayerState {
  steam_id_64: string;
  name: string;
  user_id: number;
  team: string;
  position: IVector3;
  view_direction: IVector2;
  velocity: IVector3;
  hp: number;
  armor: number;
  has_helmet: boolean;
  has_defuse_kit: boolean;
  money: number;
  current_equipment: IEquipment;
  is_alive: boolean;
  is_bot: boolean;
  is_connected: boolean;
  is_ducking: boolean;
  is_defusing: boolean;
  is_planting: boolean;
  is_reloading: boolean;
  is_scoped: boolean;
  is_walking: boolean;
  flash_duration: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  mvps: number;
}

export interface IGameState {
  round_number: number;
  phase: string;
  ct_score: number;
  t_score: number;
  time_remaining: number;
  bomb_planted: boolean;
  bomb_site?: string;
  bomb_time_remaining: number;
}

export interface IEvent {
  type: string;
  data: Record<string, unknown>;
  demo_tick?: number;
  game_tick?: number;
}

export interface IReconnection {
  steam_id_64: string;
  name: string;
  reconnect_type: string;
}

export interface IFrame {
  demo_tick: number;
  game_tick: number;
  timestamp: number;
  player_states: IPlayerState[];
  game_state: IGameState;
  events: IEvent[];
  reconnections?: IReconnection[];
}

export interface IDemoChunk {
  message_type: string;
  match_id: Types.ObjectId;
  chunk_index: number;
  start_tick: number;
  end_tick: number;
  start_game_tick: number;
  end_game_tick: number;
  frames: IFrame[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDemoChunkDocument extends IDemoChunk, Document {}
