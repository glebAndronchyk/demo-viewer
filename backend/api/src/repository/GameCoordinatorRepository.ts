import { GameCoordinatorOutboundPort } from "@demo-viewer/domain/src/ports/outbound/GameCoordinatorOutboundPort";
import axios, { AxiosInstance } from "axios";
import { NextAvailableMatchRequestParams } from "../types/steam/request/NextAvailableMatchRequestParams";
import { NextAvailableMatchResponse } from "../types/steam/response/NextAvailableMatchResponse";
import { BaseResponse } from "@demo-viewer/domain/src/types/BaseResponse";
import { decodeMatchShareCode } from "csgo-sharecode";
import GlobalOffensive from "globaloffensive";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import { SteamBotService } from "../adapters/SteamBotService";

export class GameCoordinatorRepository implements GameCoordinatorOutboundPort {
  private readonly http: AxiosInstance;
  private readonly matchListListeners = new Map<
    string,
    (match: GlobalOffensive.Match) => void
  >();

  constructor(
    private readonly configuration: ConfigurationInboundPort,
    private readonly botService: SteamBotService,
  ) {
    this.http = axios.create();

    // create a single listener for all incoming gc.matchList requests
    this.botService.gc.addListener(
      "matchList",
      (matches: GlobalOffensive.Match[]) => {
        console.log(`[GC] matches received`);

        const match = matches[0];
        if (!match) return;

        const matchId = match.matchid;

        this.matchListListeners.get(matchId)?.(match);
        this.matchListListeners.delete(matchId);
      },
    );
  }

  async pingMatchUrl(url: string): Promise<BaseResponse<never>> {
    try {
      if (!url) {
        return {
          isSuccess: false,
          data: null as never,
          error: new Error("No url given to ping."),
        };
      }

      await axios.get(url);
      return { isSuccess: true, data: null as never };
    } catch (e) {
      return {
        isSuccess: false,
        data: null as never,
        error: new Error("Demo not available anymore for download"),
      };
    }
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

    if (response.data.result.nextcode === "n/a") {
      return {
        data: null as never,
        isSuccess: false,
        error: new Error("No new code available"),
      };
    }

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
    const {
      data: decodedShareCode,
      error,
      isSuccess,
    } = await this.decodeShareCode(shareCode);

    if (!isSuccess) {
      return {
        isSuccess: false,
        data: null as never,
        error: error,
      };
    }

    const { promise, resolve } =
      Promise.withResolvers<BaseResponse<{ url: string }>>();

    console.log(`[GC] requesting game for shareCode=${shareCode}`);
    this.matchListListeners.set(decodedShareCode.matchId, (match) => {
      const url = match.roundstatsall[match.roundstatsall.length - 1].map; // map represents the demo_url
      if (!url) {
        return resolve({
          data: null as never,
          isSuccess: false,
          error: new Error("Url of match not found"),
        });
      }

      resolve({ data: { url }, isSuccess: true });
    });

    this.botService.gc.requestGame(shareCode);

    return promise;
  }

  downloadMatchById(matchId: string): Promise<BaseResponse<{ path: string }>> {
    throw new Error("Method not implemented.");
  }
}
