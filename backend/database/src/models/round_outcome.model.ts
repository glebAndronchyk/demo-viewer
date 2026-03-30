import mongoose, { Model } from 'mongoose';
import {
  IPlayerTradesDocument,
  IPlayerEconomyDocument,
  IPlayerClutchesDocument,
} from '../types/round_outcome.types';
import {
  PlayerTradesSchema,
  PlayerEconomySchema,
  PlayerClutchesSchema,
} from '../schemas/round_outcome.schema';

export const PlayerTradesModel: Model<IPlayerTradesDocument> =
  mongoose.models.PlayerTrades ||
  mongoose.model<IPlayerTradesDocument>('PlayerTrades', PlayerTradesSchema);

export const PlayerEconomyModel: Model<IPlayerEconomyDocument> =
  mongoose.models.PlayerEconomy ||
  mongoose.model<IPlayerEconomyDocument>('PlayerEconomy', PlayerEconomySchema);

export const PlayerClutchesModel: Model<IPlayerClutchesDocument> =
  mongoose.models.PlayerClutches ||
  mongoose.model<IPlayerClutchesDocument>('PlayerClutches', PlayerClutchesSchema);
