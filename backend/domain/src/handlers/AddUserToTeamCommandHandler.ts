import type { GenericCommandHandler } from "../lib/command_bus";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  AddUserToTeamCommand,
  AddUserToTeamCommandResult,
} from "../commands/AddUserToTeamCommand.ts";

export const addUserToTeamCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    AddUserToTeamCommand,
    AddUserToTeamCommandResult
  > = async (command) => {
    return {
      memberId: -1,
    } satisfies AddUserToTeamCommandResult;
  };

  handler.match = (c: object): c is AddUserToTeamCommand => {
    return (
      "type" in c &&
      c.type === ("add_user_to_team" satisfies AddUserToTeamCommand["type"])
    );
  };

  return handler;
};
