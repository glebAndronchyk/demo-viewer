import mongoose, { Model } from 'mongoose';
import {
  IPlayerAccuracyDocument,
  IPlayerReactionDocument,
  IPlayerBehaviorDocument,
  IPlayerUtilityDocument,
} from '../types/performance.types';
import {
  PlayerAccuracySchema,
  PlayerReactionSchema,
  PlayerBehaviorSchema,
  PlayerUtilitySchema,
} from '../schemas/performance.schema';

export const PlayerAccuracyModel: Model<IPlayerAccuracyDocument> =
  mongoose.models.PlayerAccuracy ||
  mongoose.model<IPlayerAccuracyDocument>('PlayerAccuracy', PlayerAccuracySchema);

export const PlayerReactionModel: Model<IPlayerReactionDocument> =
  mongoose.models.PlayerReaction ||
  mongoose.model<IPlayerReactionDocument>('PlayerReaction', PlayerReactionSchema);

export const PlayerBehaviorModel: Model<IPlayerBehaviorDocument> =
  mongoose.models.PlayerBehavior ||
  mongoose.model<IPlayerBehaviorDocument>('PlayerBehavior', PlayerBehaviorSchema);

export const PlayerUtilityModel: Model<IPlayerUtilityDocument> =
  mongoose.models.PlayerUtility ||
  mongoose.model<IPlayerUtilityDocument>('PlayerUtility', PlayerUtilitySchema);
