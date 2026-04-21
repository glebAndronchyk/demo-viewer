export interface ApiSuccessResponse<TData> {
  data: TData;
  error: null;
  isSuccess: true;
}

export interface ApiErrorResponse {
  data: null;
  error: string;
  isSuccess: false;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
