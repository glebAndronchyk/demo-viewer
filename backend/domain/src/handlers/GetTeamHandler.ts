import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetTeamCommand,
  GetTeamCommandResult,
} from "../commands/GetTeamCommand.ts";
import {
  DomainForbiddenError,
  DomainNotFoundError,
} from "../lib/errors/DomainErrors.ts";

export const getTeamHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetTeamCommand,
    GetTeamCommandResult
  > = async (command) => {
    const isMember = await outbound.teamRepository.isMember(command.groupId, command.requesterId);
    if (!isMember) throw new DomainForbiddenError("You are not a member of this team");

    const group = await outbound.teamRepository.getTeamById(command.groupId);
    if (!group) throw new DomainNotFoundError(`Team not found: ${command.groupId}`);

    return {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      isOpen: group.isOpen,
      createdAt: group.createdAt,
    } satisfies GetTeamCommandResult;
  };

  handler.match = (c: object): c is GetTeamCommand => {
    return "type" in c && c.type === ("get_team" satisfies GetTeamCommand["type"]);
  };

  return handler;
};

export const getTeamRegistration = createRegistration<GetTeamCommand, GetTeamCommandResult>(
  "get_team",
  getTeamHandler,
);

export default getTeamRegistration;
