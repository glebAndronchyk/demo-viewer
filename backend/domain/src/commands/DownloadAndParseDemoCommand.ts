import type { GenericCommand } from "../lib/command_bus";

export interface DownloadAndParseDemoCommand extends GenericCommand<"download_and_parse_demo"> {
  userSteamId: string;
  userSteamIdKey: string;
  lastKnownShareCode: string;
}
