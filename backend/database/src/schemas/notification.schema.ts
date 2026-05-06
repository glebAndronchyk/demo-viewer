import { Schema } from 'mongoose';
import type { INotificationDocument } from '../types/notification.types';

export const NotificationSchema = new Schema<INotificationDocument>(
  {
    type: { type: String, required: true, trim: true },
    recipient_user_id: { type: String, required: true, trim: true },
    payload: { type: Schema.Types.Mixed, required: true, default: {} },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'delivered', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ recipient_user_id: 1 });
NotificationSchema.index({ status: 1 });
