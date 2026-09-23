import { ApiError, request, type ApiResponse } from "@/lib/api";
import type { User } from "./types";

const AUTH_API_BASE = "/_allauth/browser/v1";
const SESSION_PATH = "/auth/session";

export type SessionData = { user?: User };

// allauth answers some endpoints with a non-2xx status that reflects the
// resulting auth state rather than a failure (e.g. 401 "unauthenticated"
// after a successful logout, or after requesting a login code without
// confirming whether the email exists). This unwraps that expected status
// back into a normal response, leaving real failures to still throw.
function allowExpectedStatus<T>(
  promise: Promise<T>,
  status: number,
): Promise<T> {
  return promise.catch((error) => {
    if (error instanceof ApiError && error.status === status && error.body) {
      return error.body as T;
    }
    throw error;
  });
}

export function getSession() {
  return request<ApiResponse<SessionData>>(
    "GET",
    `${AUTH_API_BASE}${SESSION_PATH}`,
  );
}

export function requestLoginCode(email: string) {
  return allowExpectedStatus(
    request<ApiResponse<SessionData>>(
      "POST",
      `${AUTH_API_BASE}/auth/code/request`,
      { body: JSON.stringify({ email }) },
    ),
    401,
  );
}

export function confirmLoginCode(code: string) {
  return request<ApiResponse<SessionData>>(
    "POST",
    `${AUTH_API_BASE}/auth/code/confirm`,
    { body: JSON.stringify({ code }) },
  );
}

export function logout() {
  return allowExpectedStatus(
    request<ApiResponse<SessionData>>(
      "DELETE",
      `${AUTH_API_BASE}${SESSION_PATH}`,
    ),
    401,
  );
}
