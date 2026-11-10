import { vi } from "vitest";
import { useAuth } from "@/features/auth/use-auth";
import type { SessionData } from "@/features/auth/api";
import type { User } from "@/features/auth/types";
import type { ApiResponse } from "@/lib/api/types";

export const TEST_USER: User = {
  id: "1",
  email: "test@example.com",
  is_demo: false,
};

export function mockSignedInUser(user: User = TEST_USER) {
  vi.mocked(useAuth).mockReturnValue({ user });
}

/** The session API's response for the given user, or for no user. */
export function sessionResponse(user: User | null): ApiResponse<SessionData> {
  return user
    ? { status: 200, meta: { is_authenticated: true }, data: { user } }
    : { status: 401, meta: { is_authenticated: false } };
}
