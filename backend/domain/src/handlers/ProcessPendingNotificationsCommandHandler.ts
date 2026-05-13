import type { GenericCommandHandler } from '../lib/command_bus';
import { createRegistration } from '../lib/command_bus/HandlerRegistration.ts';
import type { DomainOutbound } from '../types/DomainOutbound.ts';
import type {
  ProcessPendingNotificationsCommand,
  ProcessPendingNotificationsCommandResult,
} from '../commands/ProcessPendingNotificationsCommand.ts';

export const processPendingNotificationsCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    ProcessPendingNotificationsCommand,
    ProcessPendingNotificationsCommandResult
  > = async (command) => {
    const notifications = await outbound.notificationRepository.getExpiredPendingNotifications(
      command.batchSize,
    );

    let processed = 0;

    await Promise.all(
      notifications.map(async (notification) => {
        try {
          await outbound.notificationRepository.markAsExpired(notification.id);
          processed++;
        } catch {
          // leave notification pending to retry on next cron tick
        }
      }),
    );

    return { processed } satisfies ProcessPendingNotificationsCommandResult;
  };

  handler.match = (c: object): c is ProcessPendingNotificationsCommand => {
    return (
      'type' in c &&
      c.type === ('process_pending_notifications' satisfies ProcessPendingNotificationsCommand['type'])
    );
  };

  return handler;
};

export const processPendingNotificationsRegistration = createRegistration<
  ProcessPendingNotificationsCommand,
  ProcessPendingNotificationsCommandResult
>('process_pending_notifications', processPendingNotificationsCommandHandler);

export default processPendingNotificationsRegistration;
