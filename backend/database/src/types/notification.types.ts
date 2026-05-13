import { Document } from 'mongoose';

export interface INotification {
  type: string;
  recipient_user_id: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'dismissed' | 'expired' | 'accepted';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends INotification, Document {}
