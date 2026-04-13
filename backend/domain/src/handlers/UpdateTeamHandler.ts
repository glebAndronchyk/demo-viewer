import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  UpdateTeamCommand,
  UpdateTeamCommandResult,
} from "../commands/UpdateTeamCommand.ts";
import {
  DomainForbiddenError,
  DomainNotFoundError,
} from "../lib/errors/DomainErrors.ts";

export const updateTeamHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    UpdateTeamCommand,
    UpdateTeamCommandResult
  > = async (command) => {
    const group = await outbound.teamRepository.getTeamById(command.groupId);
    if (!group) throw new DomainNotFoundError(`Team not found: ${command.groupId}`);
    if (group.ownerId !== command.requesterId) {
      throw new DomainForbiddenError("Only the team owner can update team info");
    }

    const updated = await outbound.teamRepository.updateTeam(command.groupId, {
      name: command.name,
      isOpen: command.isOpen,
    });

    return {
      id: updated.id,
      name: updated.name,
      isOpen: updated.isOpen,
    } satisfies UpdateTeamCommandResult;
  };

  handler.match = (c: object): c is UpdateTeamCommand => {
    return "type" in c && c.type === ("update_team" satisfies UpdateTeamCommand["type"]);
  };

  return handler;
};

export const updateTeamRegistration = createRegistration<UpdateTeamCommand, UpdateTeamCommandResult>(
  "update_team",
  updateTeamHandler,
);

export default updateTeamRegistration;
