import type { GenericCommand } from '../lib/command_bus';

export interface GetSteamFriendsCommand extends GenericCommand<'get_steam_friends'> {
  requesterSteamId: string;
}

export interface GetSteamFriendsCommandResult {
  steamIds: string[];
}
