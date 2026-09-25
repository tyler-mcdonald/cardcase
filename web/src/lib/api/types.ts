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

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
