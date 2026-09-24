import type { ApiResponse } from "./types";

export const GENERIC_ERROR = "Something went wrong. Please try again.";

export class ApiError extends Error {
  status?: number;
  body?: unknown;

  constructor(message: string, status?: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export function apiErrorMessage(
  error: unknown,
  fallback: string = GENERIC_ERROR,
): string {
  if (error instanceof ApiError) {
    const body = error.body as ApiResponse | undefined;
    const message = body?.errors?.[0]?.message;
    if (message) {
      return message;
    }
  }
  return fallback;
}
