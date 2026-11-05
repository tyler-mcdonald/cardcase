import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemoWelcomeModal } from "@/features/auth/DemoWelcomeModal";
import { useLogout } from "@/features/auth/queries";
import { ApiError } from "@/lib/api/errors";
import type { User } from "@/features/auth/types";
import { useAuth } from "@/features/auth/use-auth";
import { renderWithProviders } from "@tests/render";

vi.mock("@/features/auth/use-auth");
vi.mock("@/features/auth/queries");

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseLogout = vi.mocked(useLogout);
const logout = vi.fn();

const TITLE = "Welcome to the cardcase demo 👋";

function signInAs(user: User) {
  mockedUseAuth.mockReturnValue({ user });
}

beforeEach(() => {
  localStorage.clear();
  logout.mockReset();
  mockedUseLogout.mockReturnValue({
    mutate: logout,
    isPending: false,
  } as unknown as ReturnType<typeof useLogout>);
  signInAs({ id: "2", email: "demo-2@demo.invalid", is_demo: true });
});

describe("DemoWelcomeModal", () => {
  it("welcomes a demo user the first time", async () => {
    renderWithProviders(<DemoWelcomeModal />);

    await screen.findByRole("dialog", { name: TITLE });
    screen.getByText("This account and its data are temporary.");
  });

  it("does not show for a real user", () => {
    signInAs({ id: "1", email: "me@example.com", is_demo: false });

    renderWithProviders(<DemoWelcomeModal />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays closed for the same demo user after starting to explore", async () => {
    const { unmount } = renderWithProviders(<DemoWelcomeModal />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Start exploring" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    unmount();

    renderWithProviders(<DemoWelcomeModal />);
    expect(screen.queryByRole("dialog")).toBeNull();

    signInAs({ id: "3", email: "demo-3@demo.invalid", is_demo: true });
    renderWithProviders(<DemoWelcomeModal />);
    await screen.findByRole("dialog", { name: TITLE });
  });

  it("logs out when the user chooses to sign up", async () => {
    renderWithProviders(<DemoWelcomeModal />);

    fireEvent.click(await screen.findByRole("button", { name: "Sign up" }));

    expect(logout).toHaveBeenCalled();
  });

  it("shows an error when signing out fails", async () => {
    mockedUseLogout.mockReturnValue({
      mutate: logout,
      isPending: false,
      error: new ApiError("Request failed (500)", 500, {}),
    } as unknown as ReturnType<typeof useLogout>);

    renderWithProviders(<DemoWelcomeModal />);

    await screen.findByRole("dialog", { name: TITLE });
    screen.getByRole("alert");
  });
});
