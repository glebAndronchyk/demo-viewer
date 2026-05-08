import type { ApiSuccessResponse } from "../common/ApiResponse.ts";

export interface MatchListPlayerDto {
  name: string;
  steamId: string;
  avatar: string;
}

export interface MatchListOutcomeDto {
  winner: "T" | "CT" | "Draw";
  ctWins: number;
  tWins: number;
  totalRounds: number;
}

export interface MatchListItemDto {
  demoId: string;
  matchId: string;
  map: string;
  outcome: MatchListOutcomeDto;
  players: MatchListPlayerDto[];
}

export interface MatchListPaginationDto {
  totalPages: number;
  totalItems: number;
  pageSize: number;
  page: MatchListItemDto[];
}

export interface MatchListResponseData {
  pagination: MatchListPaginationDto;
}

export type MatchListResponseDto = ApiSuccessResponse<MatchListResponseData>;
