import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetUserNotificationsCommand,
  GetUserNotificationsCommandResult,
} from "../commands/GetUserNotificationsCommand.ts";

export const getUserNotificationsHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetUserNotificationsCommand,
    GetUserNotificationsCommandResult
  > = async (command) => {
    return outbound.notificationRepository.getByUserIdAndStatus(
      command.userId,
      command.status,
    );
  };

  handler.match = (c: object): c is GetUserNotificationsCommand => {
    return "type" in c && c.type === ("get_user_notifications" satisfies GetUserNotificationsCommand["type"]);
  };

  return handler;
};

export const getUserNotificationsRegistration = createRegistration<
  GetUserNotificationsCommand,
  GetUserNotificationsCommandResult
>("get_user_notifications", getUserNotificationsHandler);

export default getUserNotificationsRegistration;