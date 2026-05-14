import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class EnvConfiguration implements ConfigurationInboundPort {
  private readonly env: typeof Bun.env;

  get statisticsQueryCapMonth(): number {
    return Number(this.env.STATISTICS_QUERY_CAP_MONTH ?? 6);
  }

  get matchesPageSize(): number {
    return Number(this.env.MATCHES_PAGE_SIZE ?? 10);
  }

  get apiPort(): number {
    return Number(this.env.API_PORT ?? 3000);
  }

  get steamBaseUrl(): string {
    return this.env.STEAM_BASE_URL ?? "";
  }

  get steamApiKey(): string {
    return this.env.STEAM_API_KEY ?? "";
  }

  get steamNextMatchShareUrl(): string {
    return this.env.STEAM_NEXT_MATCH_SHARE_URL ?? "";
  }

  get cs2AppId(): number {
    return Number(this.env.CS2_APP_ID);
  }

  get jwtSecret(): string {
    return this.env.JWT_SECRET ?? "";
  }

  get apiBaseUrl(): string {
    return this.env.API_BASE_URL ?? "";
  }

  get frontendUrl(): string {
    return this.env.FRONTEND_URL ?? "";
  }

  get databaseConnectionString(): string {
    return this.env.DB_CONNECTION_STRING ?? "";
  }

  // todo: load from secure storage
  get steamGameCoordinatorBotAccountName(): string {
    return this.env.STEAM_GAME_COORDINATOR_BOT_ACCOUNT_NAME ?? "";
  }

  get shareCodeSeekStep(): number {
    return Number(this.env.SHARE_CODE_SEEK_STEP ?? 3);
  }

  get matchesForAnalyticsSeekStep(): number {
    return Number(this.env.MATCHER_PER_ANALYTICS_SEEK_STEP ?? 3);
  }

  // todo: load from secure storage
  get steamGameCoordinatorBotAccountPassword(): string {
    return this.env.STEAM_GAME_COORDINATOR_BOT_ACCOUNT_PASSWORD ?? "";
  }

  get maxParallelRssGb(): number {
    return parseInt(this.env.MAX_PARALLEL_RSS_GB ?? "1");
  }

  get debug(): boolean {
    return this.env.DEBUG === "true";
  }

  get transientEventsLookbackTicks(): number {
    return Number(this.env.TRANSIENT_EVENTS_LOOKBACK_TICKS ?? 3000);
  }

  get storageType(): string {
    return this.env.STORAGE_TYPE ?? "local";
  }

  get storageLocalBasePath(): string {
    return this.env.STORAGE_LOCAL_BASE_PATH ?? "../storage/assets";
  }

  get preventParsing(): boolean {
    return this.env.PREVENT_PARSING
      ? this.env.PREVENT_PARSING === "true"
      : false;
  }

  constructor() {
    this.env = Bun.env;
  }

  getMapRadarFileAssetsPath(mapId: string): string {
    return `/map/${mapId}/radar/`;
  }

  getMapRadarApiPath(mapId: string, layer: string): string {
    return `${this.apiBaseUrl}/storage/static/map/${mapId}/${layer}`;
  }

  toJson() {
    const jsonObj = Object.assign({}, this);
    const proto = Object.getPrototypeOf(this);

    for (const key of Object.getOwnPropertyNames(proto)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc && typeof desc.get === "function") {
        jsonObj[key as never] = this[key as never] as never;
      }
    }
    return JSON.stringify(jsonObj, null, 2);
  }
}
