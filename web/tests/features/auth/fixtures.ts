import { vi } from "vitest";
import { useAuth } from "@/features/auth/use-auth";
import type { User } from "@/features/auth/types";

export const TEST_USER: User = {
  id: "1",
  email: "test@example.com",
  is_demo: false,
};

export function mockSignedInUser(user: User = TEST_USER) {
  vi.mocked(useAuth).mockReturnValue({ user });
}
