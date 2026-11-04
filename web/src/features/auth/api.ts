import { request } from "@/lib/api/client";
import { endpoint } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { ApiResponse } from "@/lib/api/types";
import type { User } from "./types";

const auth = endpoint("/_allauth/browser/v1").path("auth");
const session = auth.path("session");

export type SessionData = { user?: User };

/**
 * Resolves with the error body when the request fails with one of the
 * given statuses, instead of throwing.
 */
function allowExpectedStatus<T>(
  promise: Promise<T>,
  statuses: number[],
): Promise<T> {
  return promise.catch((error) => {
    if (
      error instanceof ApiError &&
      error.status !== undefined &&
      statuses.includes(error.status) &&
      error.body
    ) {
      return error.body as T;
    }
    throw error;
  });
}

export function getSession() {
  return request<ApiResponse<SessionData>>("GET", session());
}

export function requestLoginCode(email: string) {
  return allowExpectedStatus(
    request<ApiResponse<SessionData>>("POST", auth.path("code", "request")(), {
      body: JSON.stringify({ email }),
    }),
    [401],
  );
}

export function confirmLoginCode(code: string) {
  return request<ApiResponse<SessionData>>(
    "POST",
    auth.path("code", "confirm")(),
    { body: JSON.stringify({ code }) },
  );
}

export function logout() {
  return allowExpectedStatus(
    request<ApiResponse<SessionData>>("DELETE", session()),
    [401],
  );
}
