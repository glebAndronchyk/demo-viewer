import type { ApiSuccessResponse } from "../common/ApiResponse.ts";

export interface ParseRemoteResponseData {
  url: string | null;
}

export type ParseRemoteResponseDto = ApiSuccessResponse<ParseRemoteResponseData>;
