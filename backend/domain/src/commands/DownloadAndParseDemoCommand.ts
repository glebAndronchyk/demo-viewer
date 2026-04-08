import type { GenericCommand } from "../lib/command_bus";

export interface DownloadAndParseDemoCommand extends GenericCommand<"download_and_parse_demo"> {
  userId: string;
  userSteamId: string;
  userSteamIdKey: string;
  lastKnownShareCode: string;
}

export interface DownloadAndParseDemoCommandResult {
  url: string;
}
