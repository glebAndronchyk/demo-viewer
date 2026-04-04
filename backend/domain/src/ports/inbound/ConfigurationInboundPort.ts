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
}
