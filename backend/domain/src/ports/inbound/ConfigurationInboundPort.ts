export interface ConfigurationInboundPort {
  /**
   * A base url of the steam
   */
  steamBaseUrl: string;
  /**
   * An api key to access developer features
   */
  steamApiKey: string;
  /**
   * Url to receive next available user match
   */
  steamNextMatchShareUrl: string;
  /**
   * App id representing CS2 game in steam
   */
  cs2AppId: number;
  /**
   * Jwt secret
   */
  jwtSecret: string;
  /**
   * Base URL of this API server
   */
  apiBaseUrl: string;
  /**
   * Base URL of this API server
   */
  databaseConnectionString: string;
  /**
   * URL of the frontend application
   */
  frontendUrl: string;
  /**
   * Bot account name
   */
  steamGameCoordinatorBotAccountName: string;
  /**
   * Bot account password
   */
  steamGameCoordinatorBotAccountPassword: string;
  /**
   * Number of users to process per seek step
   */
  shareCodeSeekStep: number;
  /**
   * Number of matches to process per analytics seek step
   */
  matchesForAnalyticsSeekStep: number;
  /**
   * Maximum ram usage for parallel demo parsing and analytics calculation in gigabytes
   */
  maxParallelRssGb: number;
  /**
   * Enable debug logging
   */
  debug: boolean;
  /**
   * How many ticks to look back when querying transient events at a given tick
   */
  transientEventsLookbackTicks: number;
  /**
   * Storage provider type. Determines which StorageOutboundPort adapter is used.
   * 'local' uses the local filesystem; future values: 's3', 'azure', 'gcs'.
   */
  storageType: string;
  /**
   * Base path for local filesystem storage (used when storageType is 'local').
   */
  storageLocalBasePath: string;

  /**
   * Gets path to folder of radar assets (layers)
   * @param mapId
   */
  getMapRadarFileAssetsPath(mapId: string): string;

  /**
   * Gets the api url to the assets of map
   */
  getMapRadarApiPath(mapId: string, layer: string): string;

  /**
   * Page size of the matches list for ui
   */
  matchesPageSize: number;

  /**
   * a cap for statistics range. adjust to aggregate stats from broader period
   */
  statisticsQueryCapMonth: number;

  /**
   * Prevent running of cron job related to matches collection
   */
  preventParsing: boolean;
}
