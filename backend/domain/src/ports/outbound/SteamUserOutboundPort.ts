export interface SteamPlayerSummary {
  steamId: string;
  avatarUrl: string;
}

export interface SteamUserOutboundPort {
  getPlayerSummaries(steamIds: string[]): Promise<SteamPlayerSummary[]>;
}
