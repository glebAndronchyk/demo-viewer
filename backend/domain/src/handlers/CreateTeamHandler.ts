import type {
  CreateTeamCommand,
  CreateTeamCommandResult,
} from "../commands/CreateTeamCommand.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
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

export const createTeamRegistration = createRegistration<CreateTeamCommand, CreateTeamCommandResult>(
  "create_team",
  createTeamHandler,
);

export default createTeamRegistration;
