import mongoose, { Model } from 'mongoose';
import { IPlayerStatsDocument } from '../types/player_stats.types';
import { PlayerStatsSchema } from '../schemas/player_stats.schema';

export const PlayerStatsModel: Model<IPlayerStatsDocument> =
  mongoose.models.PlayerStats ||
  mongoose.model<IPlayerStatsDocument>('PlayerStats', PlayerStatsSchema);
