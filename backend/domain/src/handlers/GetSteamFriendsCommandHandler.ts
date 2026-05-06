import type { GenericCommandHandler } from '../lib/command_bus';
import { createRegistration } from '../lib/command_bus/HandlerRegistration.ts';
import type { DomainOutbound } from '../types/DomainOutbound.ts';
import type {
  GetSteamFriendsCommand,
  GetSteamFriendsCommandResult,
} from '../commands/GetSteamFriendsCommand.ts';

export const getSteamFriendsCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetSteamFriendsCommand,
    GetSteamFriendsCommandResult
  > = async (command) => {
    const steamIds = await outbound.steamFriendsRepository.getFriendsOf(command.requesterSteamId);
    return { steamIds } satisfies GetSteamFriendsCommandResult;
  };

  handler.match = (c: object): c is GetSteamFriendsCommand => {
    return 'type' in c && c.type === ('get_steam_friends' satisfies GetSteamFriendsCommand['type']);
  };

  return handler;
};

export const getSteamFriendsRegistration = createRegistration<
  GetSteamFriendsCommand,
  GetSteamFriendsCommandResult
>('get_steam_friends', getSteamFriendsCommandHandler);

export default getSteamFriendsRegistration;
