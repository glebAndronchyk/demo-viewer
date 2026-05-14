import { GameCoordinatorOutboundPort } from "@demo-viewer/domain/src/ports/outbound/GameCoordinatorOutboundPort";
import axios, { AxiosInstance } from "axios";
import { NextAvailableMatchRequestParams } from "../types/steam/request/NextAvailableMatchRequestParams";
import { NextAvailableMatchResponse } from "../types/steam/response/NextAvailableMatchResponse";
import { BaseResponse } from "@demo-viewer/domain/src/types/BaseResponse";
import { decodeMatchShareCode } from "csgo-sharecode";
import GlobalOffensive from "globaloffensive";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import { SteamBotService } from "../adapters/SteamBotService";
import { MemoryCache, MemoryCacheAccessor } from "@demo-viewer/backend-shared";

export class GameCoordinatorRepository implements GameCoordinatorOutboundPort {
  private readonly http: AxiosInstance;
  private readonly matchListListeners = new Map<
    string,
    (match: GlobalOffensive.Match) => void
  >();
  private gcListenerRegistered = false;
  private readonly shareCodeCache: MemoryCacheAccessor<string, unknown>;

  constructor(
    private readonly configuration: ConfigurationInboundPort,
    private readonly botService: SteamBotService,
    private readonly cache: MemoryCache,
  ) {
    this.http = axios.create();
    this.shareCodeCache = new MemoryCacheAccessor(cache, "share-code");
  }

  private ensureGcListener() {
    if (this.gcListenerRegistered) return;
    this.gcListenerRegistered = true;

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

    this.ensureGcListener();

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

      console.log(`[GC] received url for match:${url}`);
      resolve({ data: { url }, isSuccess: true });
    });

    this.botService.gc.requestGame(shareCode);

    return promise;
  }

  downloadMatchById(matchId: string): Promise<BaseResponse<{ path: string }>> {
    throw new Error("Method not implemented.");
  }

  markShareCodeAsCorrupted(code: string) {
    const cacheKey = `share-code:corrupted:${code}`;

    this.shareCodeCache.set(cacheKey, true);

    return Promise.resolve();
  }

  isShareCodeCorrupted(code: string): Promise<boolean> {
    const cacheKey = `share-code:corrupted:${code}`;

    return Promise.resolve(this.shareCodeCache.has(cacheKey));
  }
}
