import Cookies from "js-cookie";
import { ApiError } from "./errors";

const API_URL = import.meta.env.VITE_API_URL;
const LOAD_TIMEOUT_MS = 15_000;

function requestSignal(method: string, signal?: AbortSignal | null) {
  if (method !== "GET") {
    return signal;
  }
  const timeout = AbortSignal.timeout(LOAD_TIMEOUT_MS);
  if (!signal) {
    return timeout;
  }
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([signal, timeout]);
  }
  const controller = new AbortController();
  for (const source of [signal, timeout]) {
    if (source.aborted) {
      controller.abort(source.reason);
      break;
    }
    source.addEventListener("abort", () => controller.abort(source.reason), {
      once: true,
    });
  }
  return controller.signal;
}

function networkError(cause: unknown) {
  return new ApiError(cause instanceof Error ? cause.message : "Network error");
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

  const signal = requestSignal(method, options.signal);

  let response: Response;
  try {
    response = await fetch(new URL(path, API_URL), {
      ...options,
      method,
      headers,
      signal,
      credentials: "include",
    });
  } catch (cause) {
    throw networkError(cause);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch (cause) {
    if (response.ok && signal?.aborted) {
      throw networkError(cause);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      `Request failed (${response.status})`,
      response.status,
      body,
    );
  }

  return body as T;
}
