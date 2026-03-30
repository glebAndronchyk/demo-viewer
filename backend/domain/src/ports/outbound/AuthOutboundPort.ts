export interface UserRecord {
  id: string;
  steam_id: string;
  createdAt: Date;
}

export interface AuthOutboundPort {
  findUserBySteamId(steamId: string): Promise<UserRecord | null>;
  createUser(steamId: string): Promise<UserRecord>;
  linkMatchesToUser(steamId: string, userId: string): Promise<number>;
  signJwt(payload: { sub: string; steamId: string }): Promise<string>;
}
