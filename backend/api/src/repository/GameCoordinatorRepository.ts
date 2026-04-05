import { GameCoordinatorOutboundPort } from "@demo-viewer/domain/src/ports/outbound/GameCoordinatorOutboundPort";
import axios, { AxiosInstance } from "axios";
import { NextAvailableMatchRequestParams } from "../types/steam/request/NextAvailableMatchRequestParams";
import { NextAvailableMatchResponse } from "../types/steam/response/NextAvailableMatchResponse";
import { BaseResponse } from "@demo-viewer/domain/src/types/BaseResponse";
import { decodeMatchShareCode } from "csgo-sharecode";
import GlobalOffensive from "globaloffensive";
import SteamUser from "steam-user";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class GameCoordinatorRepository implements GameCoordinatorOutboundPort {
  private gcConnected: boolean = false;
  private readonly gcWaitDelayMs: number = 2000;
  private readonly gcRetryCount: number = 5;

  private readonly gc: GlobalOffensive;
  private readonly http: AxiosInstance;

  constructor(private readonly configuration: ConfigurationInboundPort) {
    this.http = axios.create();

    const steamUser = new SteamUser();
    this.gc = new GlobalOffensive(steamUser);

    // load the game
    steamUser.gamesPlayed([this.configuration.steamApiKey]);

    this.gc.on("connectionStatus", (status) => {
      if (status === GlobalOffensive.GCConnectionStatus.NO_SESSION) {
        // retry session when connection lost
        steamUser.gamesPlayed([this.configuration.steamApiKey]);
        this.gcConnected = false;
      }

      if (status === GlobalOffensive.GCConnectionStatus.HAVE_SESSION) {
        this.gcConnected = true;
      }
    });
  }

  // todo: error handling
  async getNextAvailableShareCode(
    steamId: string,
    steamIdKey: string,
    knownShareCode: string,
  ): Promise<BaseResponse<{ nextCode: string }>> {
    const { configuration } = this;

    const response = await this.http.get<NextAvailableMatchResponse>(
      this.configuration.steamNextMatchShareUrl,
      {
        params: {
          key: configuration.steamApiKey,
          steamid: steamId,
          steamidkey: steamIdKey,
          knowncode: knownShareCode,
        } satisfies NextAvailableMatchRequestParams,
      },
    );

    return {
      data: { nextCode: response.data.result.nextcode },
      isSuccess: true,
    };
  }

  decodeShareCode(
    shareCode: string,
  ): Promise<BaseResponse<{ matchId: string }>> {
    try {
      const { matchId } = decodeMatchShareCode(shareCode);
      return Promise.resolve({
        data: { matchId: matchId.toString() },
        isSuccess: true,
      });
    } catch (error) {
      return Promise.resolve({
        isSuccess: false,
        data: null as never,
        error: error as Error,
      });
    }
  }

  async getMatchUrlById(
    shareCode: string,
  ): Promise<BaseResponse<{ url: string }>> {
    const { promise, resolve } =
      Promise.withResolvers<BaseResponse<{ url: string }>>();

    const { isSuccess: isGcConnected } = await this.waitForGcToConnect();
    if (!isGcConnected)
      return {
        data: null as never,
        error: new Error("Timeout during gc connection"),
        isSuccess: false,
      };

    this.gc.requestGame(shareCode);

    // wait for game to fetch // todo: handle timeout here too
    const matchListHandler = (
      matches: GlobalOffensive.Match[],
      _: GlobalOffensive.MatchesData,
    ) => {
      const match = matches[0];
      if (!match) {
        return resolve({
          data: null as never,
          isSuccess: false,
          error: new Error("Match not found"),
        });
      }

      const url = match.roundstatsall[0].map; // map represents the demo_url
      if (!url) {
        return resolve({
          data: null as never,
          isSuccess: false,
          error: new Error("Url of match not found"),
        });
      }

      resolve({ data: { url }, isSuccess: true });
      this.gc.off("matchList", matchListHandler);
    };

    this.gc.on("matchList", matchListHandler);

    return promise;
  }

  downloadMatchById(matchId: string): Promise<BaseResponse<{ path: string }>> {
    throw new Error("Method not implemented.");
  }

  /**
   * Waits game coordinator to load
   */
  private waitForGcToConnect(): Promise<BaseResponse<never>> {
    const { promise, resolve } = Promise.withResolvers<BaseResponse<never>>();
    let retries = 0;
    const interval = setInterval(() => {
      if (this.gcConnected) {
        clearInterval(interval);
        return resolve({ isSuccess: true, data: null as never });
      }
      if (retries >= this.gcRetryCount) {
        clearInterval(interval);
        return resolve({ isSuccess: false, data: null as never });
      }
      retries++;
    }, this.gcWaitDelayMs);

    return promise;
  }
}
