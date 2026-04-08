import type { GenericCommand } from "../lib/command_bus";

export interface SeekNextAvailableCodeOfNextUsersCommand extends GenericCommand<"seek_next_available_code_of_next_users"> {
  seekIndex: number;
}

export interface SeekNextAvailableCodeOfNextUsersCommandResult {
  users: Array<{
    userId: string;
    userSteamId: string;
    userSteamIdKey: string;
    lastKnownShareCode: string;
  }>;
  nextSeekIndex: number;
}
