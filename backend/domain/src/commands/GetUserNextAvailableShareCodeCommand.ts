import type { GenericCommand } from "../lib/command_bus";

export interface GetUserNextAvailableShareCodeCommand extends GenericCommand<"get_user_next_available_share_code"> {
  userId: string;
}

export interface GetUserNextAvailableShareCodeCommandResult {
  shareCode: string;
}
