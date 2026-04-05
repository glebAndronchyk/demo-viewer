import { Document } from 'mongoose';

export interface IParticipant {
  steam_id?: string;
  user_id?: string;
  player_name: string;
  is_bot: boolean;
}

export interface IMatch {
  date_uploaded: Date;
  date_played: Date;
  chunk_count: number;
  participants: IParticipant[];
  map_id: string;
  visible_for_all: boolean;
  group_id?: string | null;
  crawled: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Demo header metadata (from parser)
  demo_id: string;
  map_name: string;
  server_name: string;
  client_name: string;
  duration: number;
  tick_rate: number;
  frame_rate: number;
  signon_length: number;
  playback_ticks: number;
  playback_frames: number;
  parsed_at: string;
}

export interface IMatchDocument extends IMatch, Document {}
