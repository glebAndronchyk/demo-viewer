import type { GenericCommand } from "../lib/command_bus";

export interface LinkMatchesToUserCommand
  extends GenericCommand<"link_matches_to_user"> {
  steamId: string;
  userId: string;
}

export interface LinkMatchesToUserCommandResult {
  linkedCount: number;
}
