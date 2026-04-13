import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  AddUserToTeamCommand,
  AddUserToTeamCommandResult,
} from "../commands/AddUserToTeamCommand.ts";
import {
  DomainForbiddenError,
  DomainNotFoundError,
} from "../lib/errors/DomainErrors.ts";

export const addUserToTeamCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    AddUserToTeamCommand,
    AddUserToTeamCommandResult
  > = async (command) => {
    const group = await outbound.teamRepository.getTeamById(command.groupId);
    if (!group) throw new DomainNotFoundError(`Team not found: ${command.groupId}`);
    if (group.ownerId !== command.requesterId) {
      throw new DomainForbiddenError("Only the team owner can invite members");
    }

    const user = await outbound.userRepository.getUserBySteamId(command.steamId);
    if (!user) throw new DomainNotFoundError(`User with steamId ${command.steamId} not found`);

    const member = await outbound.teamRepository.addMember(command.groupId, user.id);
    return { memberId: member.id } satisfies AddUserToTeamCommandResult;
  };

  handler.match = (c: object): c is AddUserToTeamCommand => {
    return (
      "type" in c &&
      c.type === ("add_user_to_team" satisfies AddUserToTeamCommand["type"])
    );
  };

  return handler;
};

export const addUserToTeamRegistration = createRegistration<AddUserToTeamCommand, AddUserToTeamCommandResult>(
  "add_user_to_team",
  addUserToTeamCommandHandler,
);

export default addUserToTeamRegistration;
