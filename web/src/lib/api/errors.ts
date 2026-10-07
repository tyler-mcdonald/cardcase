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

type FieldErrorsBody = Record<string, string[] | undefined>;

export function apiFieldErrors(
  error: unknown,
  fields: readonly string[],
): Record<string, string> {
  if (!hasApiStatus(error, 400)) {
    return {};
  }
  const body = (error.body ?? {}) as FieldErrorsBody;
  return Object.fromEntries(
    fields.flatMap((field) => {
      const message = body[field]?.[0];
      return message ? [[field, message]] : [];
    }),
  );
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

export function isClientError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500
  );
}

export function hasApiStatus(
  error: unknown,
  status: number,
): error is ApiError {
  return error instanceof ApiError && error.status === status;
}

function isNotFound(error: unknown): boolean {
  if (!hasApiStatus(error, 404)) {
    return false;
  }
  const body = error.body as { detail?: unknown } | null;
  return typeof body?.detail === "string";
}

/**
 * Awaits a request, treating an API 404 as success, e.g. a delete whose
 * resource is already gone. Other errors are rethrown.
 */
export async function ignoreNotFound(request: Promise<unknown>): Promise<void> {
  try {
    await request;
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }
}
