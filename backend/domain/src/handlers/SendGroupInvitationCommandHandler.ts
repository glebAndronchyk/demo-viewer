import type { GenericCommandHandler } from '../lib/command_bus';
import { createRegistration } from '../lib/command_bus/HandlerRegistration.ts';
import type { DomainOutbound } from '../types/DomainOutbound.ts';
import type {
  SendGroupInvitationCommand,
  SendGroupInvitationCommandResult,
} from '../commands/SendGroupInvitationCommand.ts';
import {
  DomainConflictError,
  DomainForbiddenError,
  DomainNotFoundError,
} from '../lib/errors/DomainErrors.ts';

export const sendGroupInvitationCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    SendGroupInvitationCommand,
    SendGroupInvitationCommandResult
  > = async (command) => {
    const group = await outbound.teamRepository.getTeamById(command.groupId);
    if (!group) throw new DomainNotFoundError(`Team not found: ${command.groupId}`);
    if (group.ownerId !== command.requesterId) {
      throw new DomainForbiddenError('Only the team owner can invite members');
    }

    const friendSteamIds = await outbound.steamFriendsRepository.getFriendsOf(
      command.requesterSteamId,
    );
    if (!friendSteamIds.includes(command.targetSteamId)) {
      throw new DomainForbiddenError('Target user is not in your Steam friends list');
    }

    const targetUser = await outbound.userRepository.getUserBySteamId(command.targetSteamId);
    if (!targetUser) {
      throw new DomainNotFoundError(`User with steamId ${command.targetSteamId} not found`);
    }

    const alreadyPending = await outbound.notificationRepository.hasPendingInvitation(
      targetUser.id,
      command.groupId,
    );
    if (alreadyPending) {
      throw new DomainConflictError('A pending invitation already exists for this user and group');
    }

    const notification = await outbound.notificationRepository.createNotification({
      type: 'group_invitation',
      recipientUserId: targetUser.id,
      payload: { groupId: command.groupId, invitedBy: command.requesterId },
      status: 'pending',
    });

    return { notificationId: notification.id } satisfies SendGroupInvitationCommandResult;
  };

  handler.match = (c: object): c is SendGroupInvitationCommand => {
    return 'type' in c && c.type === ('send_group_invitation' satisfies SendGroupInvitationCommand['type']);
  };

  return handler;
};

export const sendGroupInvitationRegistration = createRegistration<
  SendGroupInvitationCommand,
  SendGroupInvitationCommandResult
>('send_group_invitation', sendGroupInvitationCommandHandler);

export default sendGroupInvitationRegistration;
