import type { MatchEntity } from "../../entities/MatchEntity.ts";
import type { DemoChunkEntity } from "../../entities/DemoChunkEntity.ts";

export interface MatchOutboundPort {
  findByShareCode(shareCode: string): Promise<{ id: string } | null>;
  findByMatchId(matchId: string): Promise<MatchEntity | null>;
  getTicksRange(payload: {
    step: number;
    startGameTick: number;
    endGameTick: number;
    demoId: string;
  }): Promise<DemoChunkEntity["frames"] | null>;
}
