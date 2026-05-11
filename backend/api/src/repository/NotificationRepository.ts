import { NotificationModel } from "@demo-viewer/database";
import type { NotificationOutboundPort } from "@demo-viewer/domain/src/ports/outbound/NotificationOutboundPort";
import type { NotificationEntity } from "@demo-viewer/domain/src/entities/NotificationEntity";
import { toNotificationEntity } from "../mappers/notification.mapper";
import { DomainNotFoundError } from "@demo-viewer/domain/src/lib/errors/DomainErrors";
import { DatabaseService } from "../adapters/DatabaseService.ts";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort.ts";

export class NotificationRepository implements NotificationOutboundPort {
  private readonly subscribers: Map<
    string,
    Set<(n: NotificationEntity) => void>
  > = new Map();

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

    const entity = toNotificationEntity(doc);
    this.notify(entity.recipientUserId, entity);
    return entity;
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

    this.notify(result.recipient_user_id, toNotificationEntity(result));
  }

  async markAsDismissed(id: string): Promise<void> {
    const result = await this.database.NotificationModel.findByIdAndUpdate(id, {
      $set: { status: "dismissed" },
    });
    if (!result) throw new DomainNotFoundError(`Notification not found: ${id}`);

    this.notify(result.recipient_user_id, toNotificationEntity(result));
  }

  async getPendingForUser(userId: string): Promise<NotificationEntity[]> {
    const docs = await this.database.NotificationModel.find({
      recipient_user_id: userId,
      status: "pending",
    }).lean();
    return docs.map(toNotificationEntity);
  }

  async getByUserIdAndStatus(
    userId: string,
    status: NotificationEntity["status"],
  ): Promise<NotificationEntity[]> {
    const docs = await this.database.NotificationModel.find({
      recipient_user_id: userId,
      status,
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

  private notify(key: string, n: NotificationEntity) {
    this.subscribers.get(key)?.forEach((cb) => cb(n));
  }

  subscribe(key: string, cb: (n: NotificationEntity) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(cb);

    return () => {
      const set = this.subscribers.get(key);
      if (!set) return;
      set.delete(cb);
      if (set.size === 0) this.subscribers.delete(key);
    };
  }
}
