import type { GenericCommand } from "../lib/command_bus";

export interface AddUserToTeamCommand extends GenericCommand<"add_user_to_team"> {
  groupId: string;
  steamId: string;
  requesterId: string;
}

export interface AddUserToTeamCommandResult {
  memberId: string;
}
