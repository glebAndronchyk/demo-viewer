import type { GenericCommand } from '../lib/command_bus';

export interface ProcessPendingNotificationsCommand
  extends GenericCommand<'process_pending_notifications'> {
  batchSize: number;
}

export interface ProcessPendingNotificationsCommandResult {
  processed: number;
}
