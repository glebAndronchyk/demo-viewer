import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetTeamMembersCommand,
  GetTeamMembersCommandResult,
} from "../commands/GetTeamMembersCommand.ts";
import { DomainForbiddenError } from "../lib/errors/DomainErrors.ts";

export const getTeamMembersHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetTeamMembersCommand,
    GetTeamMembersCommandResult
  > = async (command) => {
    const isMember = await outbound.teamRepository.isMember(command.groupId, command.requesterId);
    if (!isMember) throw new DomainForbiddenError("You are not a member of this team");

    const members = await outbound.teamRepository.getMembers(command.groupId);
    return { members } satisfies GetTeamMembersCommandResult;
  };

  handler.match = (c: object): c is GetTeamMembersCommand => {
    return "type" in c && c.type === ("get_team_members" satisfies GetTeamMembersCommand["type"]);
  };

  return handler;
};

export const getTeamMembersRegistration = createRegistration<GetTeamMembersCommand, GetTeamMembersCommandResult>(
  "get_team_members",
  getTeamMembersHandler,
);

export default getTeamMembersRegistration;
