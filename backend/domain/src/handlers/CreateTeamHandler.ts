import type {
  CreateTeamCommand,
  CreateTeamCommandResult,
} from "../commands/CreateTeamCommand.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import { DomainConflictError } from "../lib/errors/DomainErrors.ts";

export const createTeamHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    CreateTeamCommand,
    CreateTeamCommandResult
  > = async (command) => {
    const existing = await outbound.teamRepository.getTeamByOwnerId(command.ownerId);
    if (existing) throw new DomainConflictError("User already owns a team");

    const group = await outbound.teamRepository.createTeam(command.name, command.ownerId);
    await outbound.teamRepository.addMember(group.id, command.ownerId);

    return {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      isOpen: group.isOpen,
    } satisfies CreateTeamCommandResult;
  };

  handler.match = (c: object): c is CreateTeamCommand => {
    return "type" in c && c.type === "create_team";
  };

  return handler;
};

export const createTeamRegistration = createRegistration<CreateTeamCommand, CreateTeamCommandResult>(
  "create_team",
  createTeamHandler,
);

export default createTeamRegistration;
