import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "@/AppLayout";
import { useAuth } from "@/features/auth/use-auth";
import { useLogout } from "@/features/auth/queries";
import { renderWithProviders } from "./render";

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
  logout.mockReset();
  mockedUseAuth.mockReturnValue({
    user: { id: "1", email: "test@example.com" },
  });
  mockedUseLogout.mockReturnValue({
    mutate: logout,
  } as unknown as ReturnType<typeof useLogout>);
});

function renderLayout(route: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<div>Home content</div>} />
        <Route path="other" element={<div>Other content</div>} />
        <Route path="transactions" element={<div>Transactions content</div>} />
        <Route path="settings" element={<div>Settings content</div>} />
      </Route>
    </Routes>,
    { route },
  );
}

function openAccountMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
}

describe("AppLayout", () => {
  it("renders the header around the current page", () => {
    renderLayout("/other");

    screen.getByRole("button", { name: "Account menu" });
    screen.getByText("Other content");
  });

  it("shows only the avatar menu in the header's account area", () => {
    renderLayout("/other");

    expect(screen.queryByText("test@example.com")).toBeNull();
    expect(screen.queryByRole("button", { name: "Color scheme" })).toBeNull();
    expect(screen.queryByRole("button", { name: /log out/i })).toBeNull();
  });

  it("links the brand back home", () => {
    renderLayout("/other");

    fireEvent.click(screen.getByRole("link", { name: "cardcase" }));

    screen.getByText("Home content");
  });

  it("navigates between accounts and transactions", () => {
    renderLayout("/other");

    fireEvent.click(screen.getByRole("link", { name: "Transactions" }));
    screen.getByText("Transactions content");

    fireEvent.click(screen.getByRole("link", { name: "Accounts" }));
    screen.getByText("Home content");
  });

  it("opens settings from the avatar menu", () => {
    renderLayout("/other");
    openAccountMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Settings" }));

    screen.getByText("Settings content");
  });

  it("signs out from the avatar menu", () => {
    renderLayout("/other");
    openAccountMenu();

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(logout).toHaveBeenCalled();
  });
});
