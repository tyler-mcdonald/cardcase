import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/LoginForm";

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderLoginForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <LoginForm />
      </QueryClientProvider>
    </MantineProvider>,
  );
}

describe("LoginForm", () => {
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

    renderLoginForm();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "me@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send login code/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /confirm/i })).toBeTruthy(),
    );
    expect(screen.getByText("me@example.com", { exact: false })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /send login code/i }),
    ).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
