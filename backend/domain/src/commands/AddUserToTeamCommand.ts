import type { GenericCommand } from "../lib/command_bus";

export interface AddUserToTeamCommand extends GenericCommand<"add_user_to_team"> {
  name: string;
}

export interface AddUserToTeamCommandResult {
  memberId: number;
}
