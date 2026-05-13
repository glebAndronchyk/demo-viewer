export type NotificationStatus =
  | "pending"
  | "delivered"
  | "dismissed"
  | "expired"
  | "accepted";

export interface GroupInvitationPayload {
  groupId: string;
  invitedBy: string;
}

export interface NotificationDto<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  recipientUserId: string;
  payload: TPayload;
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
}

export type GroupInvitationNotificationDto =
  NotificationDto<GroupInvitationPayload> & {
    type: "group_invitation";
  };

export type KnownNotificationDto = GroupInvitationNotificationDto;

export interface NotificationInitEventData {
  event: "init";
  data: NotificationDto[];
}

export interface NotificationUpdateEventData {
  event: "update";
  data: NotificationDto;
}
