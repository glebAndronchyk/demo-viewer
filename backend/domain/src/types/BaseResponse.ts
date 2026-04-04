export interface BaseResponse<TData, TError = Error> {
  data: TData;
  error?: TError | null;
  isSuccess: boolean;
}
