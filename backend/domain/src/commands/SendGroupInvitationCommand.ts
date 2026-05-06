import type { GenericCommand } from '../lib/command_bus';

export interface SendGroupInvitationCommand extends GenericCommand<'send_group_invitation'> {
  requesterId: string;
  requesterSteamId: string;
  targetSteamId: string;
  groupId: string;
}

export interface SendGroupInvitationCommandResult {
  notificationId: string;
}
