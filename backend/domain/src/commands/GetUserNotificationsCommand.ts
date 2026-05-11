import type { GenericCommand } from "../lib/command_bus";
import type { NotificationEntity } from "../entities/NotificationEntity.ts";

export interface GetUserNotificationsCommand
  extends GenericCommand<"get_user_notifications"> {
  userId: string;
  status: NotificationEntity["status"];
}

export type GetUserNotificationsCommandResult = NotificationEntity[];