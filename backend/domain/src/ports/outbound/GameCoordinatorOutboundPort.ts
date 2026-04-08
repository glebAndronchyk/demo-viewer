import type { BaseResponse } from "../../types/BaseResponse.ts";

export interface GameCoordinatorOutboundPort {
  getNextAvailableShareCode(
    steamId: string,
    steamIdKey: string,
    knownShareCode: string,
  ): Promise<BaseResponse<{ nextCode: string }>>;
  decodeShareCode(
    shareCode: string,
  ): Promise<BaseResponse<{ matchId: string }>>;
  getMatchUrlById(matchId: string): Promise<BaseResponse<{ url: string }>>;
  downloadMatchById(matchId: string): Promise<BaseResponse<{ path: string }>>;
  pingMatchUrl(url?: string): Promise<BaseResponse<never>>;
}
