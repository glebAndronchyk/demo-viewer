import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import SteamUser, { EConnectionProtocol } from "steam-user";
import GlobalOffensive from "globaloffensive";
import { homedir } from "os";
import { join } from "path";

export class SteamBotService {
  get bot(): SteamUser {
    return this.user;
  }

  get gc(): GlobalOffensive {
    return this.gameCoordinator;
  }

  constructor(
    private readonly user: SteamUser,
    private readonly gameCoordinator: GlobalOffensive,
  ) {}

  /**
   * Connects to a steam user and waits for whole login process to end. May require you to enter a steam guard key
   */
  static async create(configuration: ConfigurationInboundPort) {
    const { resolve, promise } = Promise.withResolvers<SteamBotService>();

    const bot = new SteamUser({
      autoRelogin: true,
      dataDirectory: join(homedir(), "auth", "steam"),
      protocol: EConnectionProtocol.TCP,
    });

    // Must be created before loggedOn fires so it can hook into the event
    const gc = new GlobalOffensive(bot);

    bot.logOn({
      accountName: configuration.steamGameCoordinatorBotAccountName,
      password: configuration.steamGameCoordinatorBotAccountPassword,
    });

    const serviceInstance = new this(bot, gc);

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

      resolve(serviceInstance);
    });

    bot.on("steamGuard", async (domain, callback) => {
      console.log(`[STEAM_BOT] Steam Guard required, domain=${domain}`);
      const code = prompt("Enter steam guard code");
      console.log(`[STEAM_BOT] Steam Guard code entered: ${code}`);

      if (!code) return;

      callback(code);
    });

    bot.on("error", (e) => {
      console.log(`[STEAM_BOT] ERROR:`, e);
    });

    bot.on("disconnected", (eresult, msg) => {
      console.log(`[STEAM_BOT] DISCONNECTED: eresult=${eresult} msg=${msg}`);
    });

    bot.on("webSession", (sessionId, cookies) => {
      console.log("[STEAM_BOT] webSession fired");
    });

    bot.on("loginKey", (key) => {
      console.log("[STEAM_BOT] loginKey fired");
    });

    bot.on("debug", (m) => {
      console.log(`[STEAM_BOT] ${m}`);
    });

    return promise;
  }
}
