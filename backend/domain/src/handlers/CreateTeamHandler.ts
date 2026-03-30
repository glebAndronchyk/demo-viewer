import type {
  CreateTeamCommand,
  CreateTeamCommandResult,
} from "../commands/CreateTeamCommand.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import type { DomainOutbound } from "../types/DomainOutbound.ts";

export const createTeamHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    CreateTeamCommand,
    CreateTeamCommandResult
  > = async (command) => {
    return {
      name: "",
    } satisfies CreateTeamCommandResult;
  };

  handler.match = (c: object): c is CreateTeamCommand => {
    return "type" in c && c.type === "create_team";
  };

  return handler;
};
