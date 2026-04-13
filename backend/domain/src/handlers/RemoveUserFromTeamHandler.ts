import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  RemoveUserFromTeamCommand,
  RemoveUserFromTeamCommandResult,
} from "../commands/RemoveUserFromTeamCommand.ts";
import {
  DomainConflictError,
  DomainForbiddenError,
  DomainNotFoundError,
} from "../lib/errors/DomainErrors.ts";

export const removeUserFromTeamHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    RemoveUserFromTeamCommand,
    RemoveUserFromTeamCommandResult
  > = async (command) => {
    const group = await outbound.teamRepository.getTeamById(command.groupId);
    if (!group) throw new DomainNotFoundError(`Team not found: ${command.groupId}`);
    if (group.ownerId !== command.requesterId) {
      throw new DomainForbiddenError("Only the team owner can remove members");
    }
    if (command.userId === command.requesterId) {
      throw new DomainConflictError("Owner cannot remove themselves from the team");
    }

    await outbound.teamRepository.removeMember(command.groupId, command.userId);
    return { success: true } satisfies RemoveUserFromTeamCommandResult;
  };

  handler.match = (c: object): c is RemoveUserFromTeamCommand => {
    return "type" in c && c.type === ("remove_user_from_team" satisfies RemoveUserFromTeamCommand["type"]);
  };

  return handler;
};

export const removeUserFromTeamRegistration = createRegistration<RemoveUserFromTeamCommand, RemoveUserFromTeamCommandResult>(
  "remove_user_from_team",
  removeUserFromTeamHandler,
);

export default removeUserFromTeamRegistration;
