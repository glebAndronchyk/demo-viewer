import type { NotificationEntity } from '../../entities/NotificationEntity.ts';

export interface NotificationOutboundPort {
  createNotification(
    data: Omit<NotificationEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<NotificationEntity>;
  getPendingNotifications(limit: number): Promise<NotificationEntity[]>;
  markAsDelivered(id: string): Promise<void>;
  markAsDismissed(id: string): Promise<void>;
  getPendingForUser(userId: string): Promise<NotificationEntity[]>;
  hasPendingInvitation(userId: string, groupId: string): Promise<boolean>;
}
