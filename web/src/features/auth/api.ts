import { ApiError, request, type ApiResponse } from "@/lib/api";
import type { User } from "./types";

const AUTH_API_BASE = "/_allauth/browser/v1";
const SESSION_PATH = "/auth/session";

export type SessionData = { user?: User };

export function getSession() {
  return request<ApiResponse<SessionData>>(
    "GET",
    `${AUTH_API_BASE}${SESSION_PATH}`,
  );
}

export function requestLoginCode(email: string) {
  return request<ApiResponse<SessionData>>(
    "POST",
    `${AUTH_API_BASE}/auth/code/request`,
    { body: JSON.stringify({ email }) },
  ).catch((error) => {
    // allauth always answers this endpoint with 401 (it never confirms
    // whether the email exists), reserving other statuses for real
    // failures like rate limiting.
    if (error instanceof ApiError && error.status === 401 && error.body) {
      return error.body as ApiResponse<SessionData>;
    }
    throw error;
  });
}

export function confirmLoginCode(code: string) {
  return request<ApiResponse<SessionData>>(
    "POST",
    `${AUTH_API_BASE}/auth/code/confirm`,
    { body: JSON.stringify({ code }) },
  );
}

export function logout() {
  return request<ApiResponse<SessionData>>(
    "DELETE",
    `${AUTH_API_BASE}${SESSION_PATH}`,
  );
}
