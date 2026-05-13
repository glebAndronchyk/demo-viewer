import type { INotification } from '@demo-viewer/database';
import type { NotificationEntity } from '@demo-viewer/domain/src/entities/NotificationEntity';

type NotificationInput = INotification & { _id: { toString(): string } };

export function toNotificationEntity(doc: NotificationInput): NotificationEntity {
  return {
    id: doc._id.toString(),
    type: doc.type,
    recipientUserId: doc.recipient_user_id.toString(),
    payload: doc.payload,
    status: doc.status,
    expiresAt: doc.expiresAt ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
