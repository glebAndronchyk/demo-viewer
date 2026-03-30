import { Document } from 'mongoose';

export interface IParticipant {
  steam_id?: string;
  user_id?: string;
  player_name: string;
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
}

export interface IMatchDocument extends IMatch, Document {}
