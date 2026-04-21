import type { ApiSuccessResponse } from "../common/ApiResponse.ts";

export interface ParseLocalResponseData {
  demoId: string;
}

export type ParseLocalResponseDto = ApiSuccessResponse<ParseLocalResponseData>;
