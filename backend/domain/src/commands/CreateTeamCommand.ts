import type { GenericCommand } from "../lib/command_bus";

export interface CreateTeamCommand extends GenericCommand<"create_team"> {
  name: string;
}

export interface CreateTeamCommandResult {
  name: string;
}
