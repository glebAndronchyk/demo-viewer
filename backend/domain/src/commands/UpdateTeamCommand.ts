import type { GenericCommand } from "../lib/command_bus";

export interface UpdateTeamCommand extends GenericCommand<"update_team"> {
  groupId: string;
  requesterId: string;
  name?: string;
  isOpen?: boolean;
}

export interface UpdateTeamCommandResult {
  id: string;
  name: string;
  isOpen: boolean;
}
