declare module "bun" {
  interface Env {
    API_PORT: number;
    MAX_PARALLEL_RSS_GB: string;
    DEBUG: string;
    JWT_SECRET: string;
    DB_CONNECTION_STRING: string;
    STORAGE_TYPE: "local";
    STORAGE_LOCAL_BASE_PATH: string;
    SHARE_CODE_SEEK_STEP: string;
    MATCHER_PER_ANALYTICS_SEEK_STEP: string;
    MATCHES_PAGE_SIZE: string;

    STEAM_BASE_URL: string;
    STEAM_API_KEY: string;
    STEAM_NEXT_MATCH_SHARE_URL: string;
    CS2_APP_ID: number;
    STEAM_GAME_COORDINATOR_BOT_ACCOUNT_NAME: string;
    STEAM_GAME_COORDINATOR_BOT_ACCOUNT_PASSWORD: string;
  }
}
