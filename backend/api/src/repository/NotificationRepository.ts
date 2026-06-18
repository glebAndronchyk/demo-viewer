import { NotificationModel } from "@demo-viewer/database";
import { Types } from "mongoose";
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
      recipient_user_id: new Types.ObjectId(data.recipientUserId),
      payload: data.payload,
      status: data.status,
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
    });

    const entity = toNotificationEntity(doc);
    this.notify(entity.recipientUserId, entity);
    return entity;
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

  async getPendingNotifications(limit: number): Promise<NotificationEntity[]> {
    const docs = await this.database.NotificationModel.find({
      status: "pending",
    })
      .limit(limit)
      .lean();
    return docs.map(toNotificationEntity);
  }

  async getExpiredPendingNotifications(
    limit: number,
  ): Promise<NotificationEntity[]> {
    const docs = await this.database.NotificationModel.find({
      status: "pending",
      expiresAt: { $lte: new Date() },
    })
      .limit(limit)
      .lean();
    return docs.map(toNotificationEntity);
  }

  async markAsExpired(id: string): Promise<void> {
    const result = await this.database.NotificationModel.findByIdAndUpdate(
      id,
      {
        $set: { status: "expired" },
      },
      { new: true },
    );
    if (!result) throw new DomainNotFoundError(`Notification not found: ${id}`);

    this.notify(
      result.recipient_user_id.toString(),
      toNotificationEntity(result),
    );
  }

  async markAsDelivered(id: string): Promise<void> {
    const result = await this.database.NotificationModel.findByIdAndUpdate(
      id,
      {
        $set: { status: "delivered" },
      },
      { new: true },
    );
    if (!result) throw new DomainNotFoundError(`Notification not found: ${id}`);

    this.notify(
      result.recipient_user_id.toString(),
      toNotificationEntity(result),
    );
  }

  async markAsDismissed(id: string): Promise<void> {
    const result = await this.database.NotificationModel.findByIdAndUpdate(
      id,
      {
        $set: { status: "dismissed" },
      },
      { new: true },
    );
    if (!result) throw new DomainNotFoundError(`Notification not found: ${id}`);

    this.notify(
      result.recipient_user_id.toString(),
      toNotificationEntity(result),
    );
  }

  async getPendingForUser(userId: string): Promise<NotificationEntity[]> {
    const docs = await this.database.NotificationModel.find({
      recipient_user_id: new Types.ObjectId(userId),
      status: "pending",
    }).lean();
    return docs.map(toNotificationEntity);
  }

  async getByUserIdAndStatus(
    userId: string,
    status: NotificationEntity["status"],
  ): Promise<NotificationEntity[]> {
    const docs = await this.database.NotificationModel.find({
      recipient_user_id: new Types.ObjectId(userId),
      status,
    }).lean();
    return docs.map(toNotificationEntity);
  }

  async getById(id: string): Promise<NotificationEntity | null> {
    const doc = await this.database.NotificationModel.findById(id).lean();
    return doc ? toNotificationEntity(doc) : null;
  }

  async markAsAccepted(id: string): Promise<void> {
    const result = await this.database.NotificationModel.findByIdAndUpdate(
      id,
      {
        $set: { status: "accepted" },
      },
      { new: true },
    );
    if (!result) throw new DomainNotFoundError(`Notification not found: ${id}`);

    this.notify(
      result.recipient_user_id.toString(),
      toNotificationEntity(result),
    );
  }

  async hasPendingInvitation(
    userId: string,
    groupId: string,
  ): Promise<boolean> {
    const count = await this.database.NotificationModel.countDocuments({
      recipient_user_id: new Types.ObjectId(userId),
      type: "group_invitation",
      status: "pending",
      "payload.groupId": groupId,
    });
    return count > 0;
  }
}
