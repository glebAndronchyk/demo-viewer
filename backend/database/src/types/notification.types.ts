import { Document, Types } from 'mongoose';

export interface INotification {
  type: string;
  recipient_user_id: Types.ObjectId;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'dismissed' | 'expired' | 'accepted';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends INotification, Document {}
