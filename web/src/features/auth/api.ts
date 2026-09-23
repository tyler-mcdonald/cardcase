import { request, type ApiResponse } from "@/lib/api";
import type { User } from "./use-auth";

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
  return request<ApiResponse<SessionData>>(
    "DELETE",
    `${AUTH_API_BASE}${SESSION_PATH}`,
  );
}
