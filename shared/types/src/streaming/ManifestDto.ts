import type { ApiSuccessResponse } from "../common/ApiResponse.ts";

export interface ManifestRoundDto {
  roundNumber: number;
  winner: string;
  startDemoTick: number;
  endDemoTick: number;
  startGameTick: number;
  endGameTick: number;
}

export interface ManifestOutcomeDto {
  winner: string;
  tScore: number;
  ctScore: number;
}

export interface ManifestParticipantDto {
  userId?: string | null;
  steamId?: string | null;
  isBot: boolean;
  name: string;
}

export interface ManifestResponseData {
  mapName: string;
  mapRadarLayers: Record<string, string>;
  mapServer: string;
  participants: ManifestParticipantDto[];
  rounds: ManifestRoundDto[];
  outcome: ManifestOutcomeDto;
  demoId: string;
  tickRate: number;
  totalTicks: number;
}

export type ManifestResponseDto = ApiSuccessResponse<ManifestResponseData>;
