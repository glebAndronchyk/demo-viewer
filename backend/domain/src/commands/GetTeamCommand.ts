import type { GenericCommand } from "../lib/command_bus";

export interface GetTeamCommand extends GenericCommand<"get_team"> {
  groupId: string;
  requesterId: string;
}

export interface GetTeamCommandResult {
  id: string;
  name: string;
  ownerId: string;
  isOpen: boolean;
  createdAt: Date;
}
