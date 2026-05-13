import type { NotificationEntity } from "../../entities/NotificationEntity.ts";

export interface NotificationOutboundPort {
  createNotification(
    data: Omit<NotificationEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<NotificationEntity>;
  getPendingNotifications(limit: number): Promise<NotificationEntity[]>;
  getExpiredPendingNotifications(limit: number): Promise<NotificationEntity[]>;
  markAsDelivered(id: string): Promise<void>;
  markAsDismissed(id: string): Promise<void>;
  markAsExpired(id: string): Promise<void>;
  getPendingForUser(userId: string): Promise<NotificationEntity[]>;
  getByUserIdAndStatus(
    userId: string,
    status: NotificationEntity["status"],
  ): Promise<NotificationEntity[]>;
  getById(id: string): Promise<NotificationEntity | null>;
  markAsAccepted(id: string): Promise<void>;
  hasPendingInvitation(userId: string, groupId: string): Promise<boolean>;

  subscribe(userId: string, cb: (n: NotificationEntity) => void): () => void;
}
