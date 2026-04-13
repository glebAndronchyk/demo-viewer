import type { GenericCommand } from "../lib/command_bus";

export interface RemoveUserFromTeamCommand extends GenericCommand<"remove_user_from_team"> {
  groupId: string;
  userId: string;
  requesterId: string;
}

export interface RemoveUserFromTeamCommandResult {
  success: boolean;
}
