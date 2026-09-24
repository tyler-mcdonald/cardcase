export type ApiErrorDetail = {
  message: string;
  code?: string;
  param?: string;
};

export type ApiResponse<T = unknown> = {
  status: number;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: ApiErrorDetail[];
};
