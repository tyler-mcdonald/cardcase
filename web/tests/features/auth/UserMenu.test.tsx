import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/features/auth/UserMenu";
import { useAuth } from "@/features/auth/use-auth";
import { useLogout } from "@/features/auth/queries";
import { renderWithProviders } from "../../render";

vi.mock("@/features/auth/use-auth", () => ({
  useAuth: vi.fn(),
}));
vi.mock("@/features/auth/queries", () => ({
  useLogout: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseLogout = vi.mocked(useLogout);
const logout = vi.fn();

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    user: { id: "1", email: "test@example.com" },
  });
  mockedUseLogout.mockReturnValue({
    mutate: logout,
  } as unknown as ReturnType<typeof useLogout>);
});

describe("UserMenu", () => {
  it("shows the signed-in user's email", () => {
    renderWithProviders(<UserMenu />);

    screen.getByText("test@example.com");
  });

  it("logs out when the button is clicked", () => {
    renderWithProviders(<UserMenu />);

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(logout).toHaveBeenCalled();
  });
});
