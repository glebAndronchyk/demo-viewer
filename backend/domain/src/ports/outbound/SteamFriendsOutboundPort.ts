export interface SteamFriendsOutboundPort {
  getFriendsOf(steamId: string): Promise<string[]>;
}
