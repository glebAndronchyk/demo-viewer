export type NotificationStatus = "pending" | "delivered" | "dismissed";

export interface NotificationDto {
  id: string;
  type: string;
  recipientUserId: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationInitEventData {
  event: "init";
  data: NotificationDto[];
}

export interface NotificationUpdateEventData {
  event: "update";
  data: NotificationDto;
}