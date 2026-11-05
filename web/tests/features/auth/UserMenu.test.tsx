import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/features/auth/UserMenu";
import { useAuth } from "@/features/auth/use-auth";
import { useLogout } from "@/features/auth/queries";
import { renderWithProviders } from "../../render";

vi.mock("@/features/auth/use-auth");
vi.mock("@/features/auth/queries");

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseLogout = vi.mocked(useLogout);
const logout = vi.fn();

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    user: { id: "1", email: "test@example.com", is_demo: false },
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

  it("shows a demo badge instead of the email for a demo user", async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: "2", email: "demo-2@demo.invalid", is_demo: true },
    });

    renderWithProviders(<UserMenu />);

    expect(screen.queryByText("demo-2@demo.invalid")).toBeNull();
    fireEvent.focus(screen.getByText("Demo"));
    expect((await screen.findByRole("tooltip")).textContent).toBe(
      "Demo data is temporary",
    );
  });

  it("logs out when the button is clicked", () => {
    renderWithProviders(<UserMenu />);

    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    expect(logout).toHaveBeenCalled();
  });
});
