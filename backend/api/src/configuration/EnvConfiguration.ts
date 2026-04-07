import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class EnvConfiguration implements ConfigurationInboundPort {
  private readonly env: typeof Bun.env;

  get apiPort(): number {
    return this.env.API_PORT || 3000;
  }

  get steamBaseUrl(): string {
    return this.env.STEAM_BASE_URL;
  }

  get steamApiKey(): string {
    return this.env.STEAM_API_KEY;
  }

  get steamNextMatchShareUrl(): string {
    return this.env.STEAM_NEXT_MATCH_SHARE_URL;
  }

  get cs2AppId(): number {
    return Number(this.env.CS2_APP_ID);
  }

  get jwtSecret(): string {
    return this.env.JWT_SECRET;
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

  // todo: load from secure storage
  get steamGameCoordinatorBotAccountPassword(): string {
    return this.env.STEAM_GAME_COORDINATOR_BOT_ACCOUNT_PASSWORD ?? "";
  }

  constructor() {
    this.env = Bun.env;
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
