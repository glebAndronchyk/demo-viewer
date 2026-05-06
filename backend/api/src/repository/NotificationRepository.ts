import { NotificationModel } from "@demo-viewer/database";
import type { NotificationOutboundPort } from "@demo-viewer/domain/src/ports/outbound/NotificationOutboundPort";
import type { NotificationEntity } from "@demo-viewer/domain/src/entities/NotificationEntity";
import { toNotificationEntity } from "../mappers/notification.mapper";
import { DomainNotFoundError } from "@demo-viewer/domain/src/lib/errors/DomainErrors";
import { DatabaseService } from "../adapters/DatabaseService.ts";

export class NotificationRepository implements NotificationOutboundPort {
  constructor(private readonly database: DatabaseService) {}

  async createNotification(
    data: Omit<NotificationEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<NotificationEntity> {
    const doc = await NotificationModel.create({
      type: data.type,
      recipient_user_id: data.recipientUserId,
      payload: data.payload,
      status: data.status,
    });
    return toNotificationEntity(doc);
  }

  async getPendingNotifications(limit: number): Promise<NotificationEntity[]> {
    const docs = await this.database.NotificationModel.find({
      status: "pending",
    })
      .limit(limit)
      .lean();
    return docs.map(toNotificationEntity);
  }

  async markAsDelivered(id: string): Promise<void> {
    const result = await this.database.NotificationModel.findByIdAndUpdate(id, {
      $set: { status: "delivered" },
    });
    if (!result) throw new DomainNotFoundError(`Notification not found: ${id}`);
  }

  async markAsDismissed(id: string): Promise<void> {
    const result = await this.database.NotificationModel.findByIdAndUpdate(id, {
      $set: { status: "dismissed" },
    });
    if (!result) throw new DomainNotFoundError(`Notification not found: ${id}`);
  }

  async getPendingForUser(userId: string): Promise<NotificationEntity[]> {
    const docs = await this.database.NotificationModel.find({
      recipient_user_id: userId,
      status: "pending",
    }).lean();
    return docs.map(toNotificationEntity);
  }

  async hasPendingInvitation(
    userId: string,
    groupId: string,
  ): Promise<boolean> {
    const count = await this.database.NotificationModel.countDocuments({
      recipient_user_id: userId,
      type: "group_invitation",
      status: "pending",
      "payload.groupId": groupId,
    });
    return count > 0;
  }
}
