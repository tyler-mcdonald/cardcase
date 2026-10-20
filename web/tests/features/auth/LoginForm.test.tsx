import { screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/LoginForm";
import { renderWithProviders } from "../../render";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LoginForm", () => {
  it("welcomes the user and offers both login and signup", () => {
    renderWithProviders(<LoginForm />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome to cardcase" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Log in or create an account with your email"),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Continue with email" }),
    ).toBeTruthy();
  });

  it("advances to the code step on the API's real 401 pending-flow response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 401,
            data: { flows: [{ id: "login_by_code", is_pending: true }] },
            meta: { is_authenticated: false },
          }),
          { status: 401 },
        ),
      ),
    );

    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "me@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /continue with email/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /confirm/i })).toBeTruthy(),
    );
    expect(screen.getByText("me@example.com", { exact: false })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /continue with email/i }),
    ).toBeNull();
    expect(
      screen.queryByText("Log in or create an account with your email"),
    ).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
