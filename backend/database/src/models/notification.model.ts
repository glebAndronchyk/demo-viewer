import mongoose, { Model } from 'mongoose';
import type { INotificationDocument } from '../types/notification.types';
import { NotificationSchema } from '../schemas/notification.schema';

export const NotificationModel: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>('Notification', NotificationSchema);
