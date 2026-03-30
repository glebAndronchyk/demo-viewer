import mongoose, { Model } from 'mongoose';
import { IMatchDocument } from '../types/match.types';
import { MatchSchema } from '../schemas/match.schema';

export const MatchModel: Model<IMatchDocument> =
  mongoose.models.Match || mongoose.model<IMatchDocument>('Match', MatchSchema);
