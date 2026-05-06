export interface NotificationEntity {
  id: string;
  type: string;
  recipientUserId: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}
