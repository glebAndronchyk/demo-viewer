import type {
  CreateTeamCommand,
  CreateTeamCommandResult,
} from "../../commands/CreateTeamCommand.ts";
import { createTeamHandler } from "../../handlers/CreateTeamHandler.ts";
import type { CommandsMap } from "../../lib/command_bus";
import type { DomainOutbound } from "../../types/DomainOutbound.ts";
import type {
  AddUserToTeamCommand,
  AddUserToTeamCommandResult,
} from "../../commands/AddUserToTeamCommand.ts";
import { addUserToTeamCommandHandler } from "../../handlers/AddUserToTeamCommandHandler.ts";

export type Commands = [CreateTeamCommand, AddUserToTeamCommand];

export type CommandResultMap = {
  [K in CreateTeamCommand["type"]]: CreateTeamCommandResult;
} & {
  [K in AddUserToTeamCommand["type"]]: AddUserToTeamCommandResult;
};

export type DomainCommandsMap = CommandsMap<Commands, CommandResultMap>;

const domainOperationsConstructor = (
  outbound: DomainOutbound,
): DomainCommandsMap => {
  return {
    create_team: createTeamHandler(outbound),
    add_user_to_team: addUserToTeamCommandHandler(outbound),
  };
};

export default domainOperationsConstructor;
