import Cookies from "js-cookie";
import { ApiError } from "./errors";

const API_URL = import.meta.env.VITE_API_URL;
const LOAD_TIMEOUT_MS = 15_000;

function requestFailed(cause: unknown) {
  return new ApiError("Request failed", { cause });
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

  const signal =
    method === "GET" ? AbortSignal.timeout(LOAD_TIMEOUT_MS) : options.signal;

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
    throw requestFailed(cause);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch (cause) {
    if (response.ok && signal?.aborted) {
      throw requestFailed(cause);
    }
  }

  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status})`, {
      status: response.status,
      body,
    });
  }

  return body as T;
}
