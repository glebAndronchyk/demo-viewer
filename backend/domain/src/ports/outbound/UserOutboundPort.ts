export interface UserOutboundPort {
  getUsersLatestShareCodes(): Promise<
    Array<{
      lastKnownShareCode: string;
      userSteamId: string;
      userSteamIdKey: string;
    }>
  >;
}
