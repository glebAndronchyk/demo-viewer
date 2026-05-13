import type { GenericCommandHandler } from '../lib/command_bus';
import { createRegistration } from '../lib/command_bus/HandlerRegistration.ts';
import type { DomainOutbound } from '../types/DomainOutbound.ts';
import type {
  AcceptGroupInvitationCommand,
  AcceptGroupInvitationCommandResult,
} from '../commands/AcceptGroupInvitationCommand.ts';
import {
  DomainForbiddenError,
  DomainNotFoundError,
} from '../lib/errors/DomainErrors.ts';

export const acceptGroupInvitationCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    AcceptGroupInvitationCommand,
    AcceptGroupInvitationCommandResult
  > = async (command) => {
    const notification = await outbound.notificationRepository.getById(command.notificationId);
    if (!notification) throw new DomainNotFoundError(`Notification not found: ${command.notificationId}`);

    if (notification.recipientUserId !== command.requesterId) {
      throw new DomainForbiddenError('This invitation does not belong to you');
    }
    if (notification.type !== 'group_invitation') {
      throw new DomainForbiddenError('Notification is not a group invitation');
    }
    if (notification.status !== 'pending') {
      throw new DomainForbiddenError(`Invitation is already ${notification.status}`);
    }
    if (notification.expiresAt && notification.expiresAt < new Date()) {
      throw new DomainForbiddenError('Invitation has expired');
    }

    const groupId = notification.payload.groupId as string;
    const group = await outbound.teamRepository.getTeamById(groupId);
    if (!group) throw new DomainNotFoundError(`Team not found: ${groupId}`);

    const member = await outbound.teamRepository.addMember(groupId, command.requesterId);
    await outbound.notificationRepository.markAsAccepted(notification.id);

    return { memberId: member.id } satisfies AcceptGroupInvitationCommandResult;
  };

  handler.match = (c: object): c is AcceptGroupInvitationCommand => {
    return 'type' in c && c.type === ('accept_group_invitation' satisfies AcceptGroupInvitationCommand['type']);
  };

  return handler;
};

export const acceptGroupInvitationRegistration = createRegistration<
  AcceptGroupInvitationCommand,
  AcceptGroupInvitationCommandResult
>('accept_group_invitation', acceptGroupInvitationCommandHandler);

export default acceptGroupInvitationRegistration;
