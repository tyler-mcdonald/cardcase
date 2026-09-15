import Cookies from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL;

export type ApiError = {
  message: string;
  code?: string;
  param?: string;
};

export type ApiResponse<T = unknown> = {
  status: number;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: ApiError[];
};

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
