import mongoose, { Model } from 'mongoose';
import {
  IUtilitySchemaDocument,
  IPositionsStatsDocument,
} from '../types/utility_positions.types';
import {
  UtilitySchemaSchema,
  PositionsStatsSchema,
} from '../schemas/utility_positions.schema';

export const UtilitySchemaModel: Model<IUtilitySchemaDocument> =
  mongoose.models.UtilitySchema ||
  mongoose.model<IUtilitySchemaDocument>('UtilitySchema', UtilitySchemaSchema);

export const PositionsStatsModel: Model<IPositionsStatsDocument> =
  mongoose.models.PositionsStats ||
  mongoose.model<IPositionsStatsDocument>('PositionsStats', PositionsStatsSchema);
