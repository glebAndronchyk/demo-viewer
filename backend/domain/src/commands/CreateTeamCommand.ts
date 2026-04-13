import type { GenericCommand } from "../lib/command_bus";

export interface CreateTeamCommand extends GenericCommand<"create_team"> {
  name: string;
  ownerId: string;
}

export interface CreateTeamCommandResult {
  id: string;
  name: string;
  ownerId: string;
  isOpen: boolean;
}
