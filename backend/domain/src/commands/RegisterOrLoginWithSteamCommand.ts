import type { GenericCommand } from "../lib/command_bus";

export interface RegisterOrLoginWithSteamCommand
  extends GenericCommand<"register_or_login_with_steam"> {
  steamId: string;
}

export interface RegisterOrLoginWithSteamCommandResult {
  userId: string;
  steamId: string;
  isNewUser: boolean;
  token: string;
}
