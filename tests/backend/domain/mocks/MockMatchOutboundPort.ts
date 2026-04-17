import type { MatchOutboundPort } from "@demo-viewer/domain/src/ports/outbound/MatchOutboundPort.ts";
import type {
  Frame,
  PlayerState,
} from "@demo-viewer/domain/src/entities/DemoChunkEntity.ts";
import type { RoundInfo } from "@demo-viewer/domain/src/entities/MatchEntity.ts";

export class MockMatchOutboundPort implements MatchOutboundPort {
  aggregatedEventsResult: any = [];
  roundInfoMap: Map<Frame, RoundInfo | null> = new Map();
  startFrames: Frame[] = [];
  roundsResult: RoundInfo[] = [];
  playerStateResult: PlayerState | null = null;

  async getAggregatedEvents(_filter: any, _events: any, cache?: any) {
    if (cache) cache.set(this.aggregatedEventsResult);
    return this.aggregatedEventsResult as any;
  }

  async getFirstGameTickOfEveryRound(_matchId: string): Promise<Frame[]> {
    return this.startFrames;
  }

  async getRoundInfoByFrame(
    _matchId: string,
    frame: Frame,
  ): Promise<RoundInfo | null> {
    return this.roundInfoMap.get(frame) ?? null;
  }

  async getRoundsPlayedByPlayer(): Promise<RoundInfo[]> {
    return this.roundsResult;
  }

  async getPlayerFinalStateForMatch(): Promise<any> {
    return this.playerStateResult;
  }

  async findByShareCode(): Promise<any> {
    return null;
  }

  async findByMatchId(): Promise<any> {
    return { rounds: this.roundsResult };
  }

  async getTicksRange(): Promise<any> {
    return null;
  }

  async getClutchRounds(): Promise<any[]> {
    return [];
  }

  async savePlayerAnalyticalData(): Promise<{ rootCollectionId: string }> {
    return { rootCollectionId: "" };
  }

  async getMatchesPerStep(): Promise<any[]> {
    return [];
  }
}