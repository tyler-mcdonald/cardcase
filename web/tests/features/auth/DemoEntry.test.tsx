import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { DemoEntry } from "@/features/auth/DemoEntry";
import { getSession, logout, startDemo } from "@/features/auth/api";
import type { User } from "@/features/auth/types";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "../../render";

vi.mock("@/features/auth/api", () => ({
  getSession: vi.fn(),
  logout: vi.fn(),
  startDemo: vi.fn(),
}));

const mockedGetSession = vi.mocked(getSession);
const mockedLogout = vi.mocked(logout);
const mockedStartDemo = vi.mocked(startDemo);

const realUser: User = { id: "1", email: "me@example.com", is_demo: false };
const demoUser: User = {
  id: "2",
  email: "demo-2@demo.invalid",
  is_demo: true,
};

function session(user: User | null) {
  return user
    ? { status: 200, meta: { is_authenticated: true }, data: { user } }
    : { status: 401, meta: { is_authenticated: false } };
}

function renderDemoEntry() {
  return renderWithProviders(
    <AuthProvider>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/demo" element={<DemoEntry />} />
      </Routes>
    </AuthProvider>,
    { route: "/demo" },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("DemoEntry", () => {
  it("starts a demo and goes home when not signed in", async () => {
    mockedGetSession
      .mockResolvedValueOnce(session(null))
      .mockResolvedValueOnce(session(demoUser));
    mockedStartDemo.mockResolvedValueOnce(null);

    renderDemoEntry();

    await screen.findByText("Home");
    expect(mockedStartDemo).toHaveBeenCalledTimes(1);
  });

  it("goes home without starting a new demo for a demo user", async () => {
    mockedGetSession.mockResolvedValueOnce(session(demoUser));

    renderDemoEntry();

    await screen.findByText("Home");
    expect(mockedStartDemo).not.toHaveBeenCalled();
  });

  it("asks a real user to confirm and stays signed in on request", async () => {
    mockedGetSession.mockResolvedValueOnce(session(realUser));

    renderDemoEntry();

    await screen.findByText(
      "Starting the demo will sign you out of your account.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Stay signed in" }));

    await screen.findByText("Home");
    expect(mockedLogout).not.toHaveBeenCalled();
    expect(mockedStartDemo).not.toHaveBeenCalled();
  });

  it("signs a real user out and starts the demo once confirmed", async () => {
    mockedGetSession
      .mockResolvedValueOnce(session(realUser))
      .mockResolvedValueOnce(session(demoUser));
    mockedLogout.mockResolvedValueOnce(session(null));
    mockedStartDemo.mockResolvedValueOnce(null);

    renderDemoEntry();

    fireEvent.click(
      await screen.findByRole("button", { name: "Sign out and start demo" }),
    );

    await screen.findByText("Home");
    expect(mockedLogout).toHaveBeenCalledTimes(1);
    expect(mockedStartDemo).toHaveBeenCalledTimes(1);
  });

  it("explains when too many demo sessions were started", async () => {
    mockedGetSession.mockResolvedValueOnce(session(null));
    mockedStartDemo.mockRejectedValueOnce(
      new ApiError("Request failed (429)", 429, {}),
    );

    renderDemoEntry();

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(
        /too many demo sessions/i,
      ),
    );
    screen.getByRole("link", { name: "Back to login" });
  });
});
