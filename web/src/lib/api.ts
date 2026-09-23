import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL;

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

export async function request<T = unknown>(
  method: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (method !== "GET") {
    headers.set("Content-Type", "application/json");
    const csrfToken = Cookies.get("csrftoken");
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

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

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError(
      `Request failed (${response.status})`,
      response.status,
      body,
    );
  }

  return body as T;
}
