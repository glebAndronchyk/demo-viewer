import mongoose, { Model } from 'mongoose';
import {
  IPlayerWeaponsUsageDocument,
  IWeaponStatsDocument,
} from '../types/weapon.types';
import {
  PlayerWeaponsUsageSchema,
  WeaponStatsSchema,
} from '../schemas/weapon.schema';

export const PlayerWeaponsUsageModel: Model<IPlayerWeaponsUsageDocument> =
  mongoose.models.PlayerWeaponsUsage ||
  mongoose.model<IPlayerWeaponsUsageDocument>('PlayerWeaponsUsage', PlayerWeaponsUsageSchema);

export const WeaponStatsModel: Model<IWeaponStatsDocument> =
  mongoose.models.WeaponStats ||
  mongoose.model<IWeaponStatsDocument>('WeaponStats', WeaponStatsSchema);
