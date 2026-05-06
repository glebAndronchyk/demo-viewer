import type { SteamFriendsOutboundPort } from '@demo-viewer/domain/src/ports/outbound/SteamFriendsOutboundPort';
import type { ConfigurationInboundPort } from '@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort';

interface SteamFriendEntry {
  steamid: string;
  relationship: string;
}

interface SteamFriendListResponse {
  friendslist?: {
    friends: SteamFriendEntry[];
  };
}

export class SteamFriendsRepository implements SteamFriendsOutboundPort {
  constructor(private readonly configuration: ConfigurationInboundPort) {}

  async getFriendsOf(steamId: string): Promise<string[]> {
    const url = `${this.configuration.steamBaseUrl}/ISteamUser/GetFriendList/v1?key=${this.configuration.steamApiKey}&steamid=${steamId}&relationship=friend`;
    const response = await fetch(url);

    if (response.status === 401 || response.status === 403) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }

    const data = (await response.json()) as SteamFriendListResponse;
    return (data.friendslist?.friends ?? [])
      .filter((f) => f.relationship === 'friend')
      .map((f) => f.steamid);
  }
}
