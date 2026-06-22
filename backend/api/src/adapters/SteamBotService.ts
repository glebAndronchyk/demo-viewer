import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import SteamUser, { EConnectionProtocol } from "steam-user";
import GlobalOffensive from "globaloffensive";
import { homedir } from "os";
import { join } from "path";

const RETRY_BASE_DELAY_MS = 120_000;
const MAX_ATTEMPTS = 10;

export class SteamBotService {
  private _connected = false;
  private _user: SteamUser | null = null;
  private _gc: GlobalOffensive | null = null;

  get bot(): SteamUser {
    if (!this._user) throw new Error("[STEAM_BOT] Not connected yet");
    return this._user;
  }

  get gc(): GlobalOffensive {
    if (!this._gc) throw new Error("[STEAM_BOT] Not connected yet");
    return this._gc;
  }

  get isConnected(): boolean {
    return this._connected;
  }

  /**
   * Starts the Steam bot connection in the background with exponential backoff.
   * Returns immediately — does not block server startup.
   */
  static createBackground(
    configuration: ConfigurationInboundPort,
  ): SteamBotService {
    const service = new SteamBotService();
    void service.connectWithRetry(configuration);
    return service;
  }

  private async connectWithRetry(
    configuration: ConfigurationInboundPort,
    attempt = 1,
  ): Promise<void> {
    try {
      await this.connect(configuration);
    } catch (e: any) {
      const isRateLimit =
        e?.eresult === 84 || e?.message === "RateLimitExceeded";
      const label = isRateLimit ? "RateLimitExceeded" : String(e?.message ?? e);

      if (attempt >= MAX_ATTEMPTS) {
        console.error(
          `[STEAM_BOT] Giving up after ${attempt} attempts: ${label}`,
        );
        return;
      }

      const delayMs = Math.min(attempt * RETRY_BASE_DELAY_MS, 300_000);
      console.log(
        `[STEAM_BOT] ${label} — retry ${attempt}/${MAX_ATTEMPTS} in ${delayMs / 1000}s`,
      );
      await Bun.sleep(delayMs);
      return this.connectWithRetry(configuration, attempt + 1);
    }
  }

  private connect(configuration: ConfigurationInboundPort): Promise<void> {
    const { resolve, reject, promise } = Promise.withResolvers<void>();

    const bot = new SteamUser({
      autoRelogin: false,
      dataDirectory: configuration.steamAuthDirectory ?? join(homedir(), "auth", "steam"),
      protocol: EConnectionProtocol.TCP,
      ...(configuration.steamSocksProxy ? { socksProxy: configuration.steamSocksProxy } : {}),
    });

    // Must be created before loggedOn fires so it can hook into the event
    const gc = new GlobalOffensive(bot);

    bot.logOn({
      accountName: configuration.steamGameCoordinatorBotAccountName,
      password: configuration.steamGameCoordinatorBotAccountPassword,
    });

    // #region gc

    gc.on("debug", (m: string) => {
      console.log(`[GC] ${m}`);
    });

    gc.on("connectedToGC", () => {
      console.log(`[GC] connectedToGC`);
    });

    gc.on("connectionStatus", (status: number) => {
      console.log(`[GC] connectionStatus: ${status}`);
    });

    bot.on("appLaunched", (appid: number) => {
      console.log(`[STEAM_BOT] appLaunched: ${appid}`);
    });

    // #region bot

    bot.on("loggedOn", () => {
      console.log(
        `[STEAM_BOT] loggedOn, steamID=${bot.steamID}, cs2AppId=${configuration.cs2AppId} (type=${typeof configuration.cs2AppId})`,
      );
      bot.gamesPlayed([configuration.cs2AppId]);
      console.log(
        `[STEAM_BOT] gamesPlayed called, _playingAppIds=${JSON.stringify((bot as any)._playingAppIds)}`,
      );

      this._user = bot;
      this._gc = gc;
      this._connected = true;

      resolve();
    });

    bot.on("steamGuard", async (domain, callback) => {
      console.log(`[STEAM_BOT] Steam Guard required, domain=${domain}`);
      const code = configuration.steamGuardCode || prompt("Enter steam guard code");
      console.log(`[STEAM_BOT] Steam Guard code entered: ${code}`);
      if (!code) return;
      callback(code);
    });

    bot.on("error", (e: Error & { eresult?: number }) => {
      console.log(`[STEAM_BOT] ERROR:`, e);
      reject(e);
    });

    bot.on("disconnected", (eresult, msg) => {
      console.log(`[STEAM_BOT] DISCONNECTED: eresult=${eresult} msg=${msg}`);
      if (this._connected) {
        this._connected = false;
        this._user = null;
        this._gc = null;
        console.log(`[STEAM_BOT] Scheduling reconnect...`);
        void this.connectWithRetry(configuration);
      }
    });

    bot.on("webSession", () => {
      console.log("[STEAM_BOT] webSession fired");
    });

    bot.on("loginKey", () => {
      console.log("[STEAM_BOT] loginKey fired");
    });

    bot.on("debug", (m: string, ...args: any[]) => {
      console.log(`[STEAM_BOT] ${m}`, ...args.map((a: any) => a instanceof Error ? `${a.message} (eresult=${(a as any).eresult})` : JSON.stringify(a)));
    });

    return promise;
  }
}
