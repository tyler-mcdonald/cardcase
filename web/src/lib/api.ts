import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL;

export const GENERIC_ERROR = "Something went wrong. Please try again.";

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

function buildHeaders(method: string, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);

  if (method !== "GET") {
    headers.set("Content-Type", "application/json");
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  return headers;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const method = options.method ?? "GET";

  return fetch(new URL(path, API_URL), {
    ...options,
    method,
    headers: buildHeaders(method, options.headers),
    credentials: "include",
  });
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await apiFetch(path, options);
  return (await response.json()) as ApiResponse<T>;
}

export async function request<T = unknown>(
  method: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = buildHeaders(method, options.headers);

  let response: Response;
  try {
    response = await fetch(new URL(path, API_URL), {
      ...options,
      method,
      headers,
      credentials: "include",
    });
  } catch (cause) {
    throw new ApiError(
      cause instanceof Error ? cause.message : "Network error",
    );
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      `Request failed (${response.status})`,
      response.status,
      body,
    );
  }

  return body as T;
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
