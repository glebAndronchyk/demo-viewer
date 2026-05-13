import type { GenericCommand } from '../lib/command_bus';

export interface AcceptGroupInvitationCommand extends GenericCommand<'accept_group_invitation'> {
  requesterId: string;
  notificationId: string;
}

export interface AcceptGroupInvitationCommandResult {
  memberId: string;
}
