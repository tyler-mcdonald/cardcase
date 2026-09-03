import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { apiRequest, type ApiResponse } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn(),
}));

const mockedApiRequest = vi.mocked(apiRequest);

const GENERIC_ERROR = "Something went wrong. Please try again.";

function anonymousSession(): ApiResponse {
  return { status: 200, meta: { is_authenticated: false } };
}

function authenticatedSession(email: string): ApiResponse {
  return {
    status: 200,
    meta: { is_authenticated: true },
    data: { user: { id: "1", email } },
  };
}

function AuthHarness() {
  const { status, user, requestLoginCode, confirmLoginCode, logout } =
    useAuth();
  const [result, setResult] = useState("");

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? ""}</span>
      <span data-testid="result">{result}</span>
      <button
        onClick={async () =>
          setResult(JSON.stringify(await requestLoginCode("test@example.com")))
        }
      >
        request
      </button>
      <button
        onClick={async () =>
          setResult(JSON.stringify(await confirmLoginCode("123456")))
        }
      >
        confirm
      </button>
      <button onClick={async () => setResult(JSON.stringify(await logout()))}>
        logout
      </button>
    </div>
  );
}

async function renderHarness(initialSession: ApiResponse) {
  mockedApiRequest.mockResolvedValueOnce(initialSession);
  render(
    <AuthProvider>
      <AuthHarness />
    </AuthProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId("status")).not.toHaveTextContent("loading"),
  );
}

beforeEach(() => {
  mockedApiRequest.mockReset();
});

describe("AuthProvider", () => {
  it("starts anonymous when the session fetch reports unauthenticated", async () => {
    await renderHarness(anonymousSession());

    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("email")).toHaveTextContent("");
  });

  it("becomes authenticated with the session user when the session fetch reports authenticated", async () => {
    await renderHarness(authenticatedSession("test@example.com"));

    expect(screen.getByTestId("status")).toHaveTextContent("authenticated");
    expect(screen.getByTestId("email")).toHaveTextContent("test@example.com");
  });

  it("requestLoginCode resolves ok on success", async () => {
    await renderHarness(anonymousSession());
    mockedApiRequest.mockResolvedValueOnce({ status: 200 });

    fireEvent.click(screen.getByText("request"));

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}'),
    );
  });

  it("confirmLoginCode applies the session and reports ok on success", async () => {
    await renderHarness(anonymousSession());
    mockedApiRequest.mockResolvedValueOnce(
      authenticatedSession("test@example.com"),
    );

    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("email")).toHaveTextContent("test@example.com");
    expect(screen.getByTestId("result")).toHaveTextContent('{"ok":true}');
  });

  it("confirmLoginCode returns the error and leaves the session unauthenticated", async () => {
    await renderHarness(anonymousSession());
    mockedApiRequest.mockResolvedValueOnce({
      status: 400,
      errors: [{ message: "Incorrect code." }],
    });

    fireEvent.click(screen.getByText("confirm"));

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent("Incorrect code."),
    );
    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
  });

  it("logout resets the session to anonymous", async () => {
    await renderHarness(authenticatedSession("test@example.com"));
    mockedApiRequest.mockResolvedValueOnce(anonymousSession());

    fireEvent.click(screen.getByText("logout"));

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("anonymous"),
    );
    expect(screen.getByTestId("email")).toHaveTextContent("");
  });

  it("returns a generic error when the request throws", async () => {
    await renderHarness(anonymousSession());
    mockedApiRequest.mockRejectedValueOnce(new Error("network down"));

    fireEvent.click(screen.getByText("request"));

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent(GENERIC_ERROR),
    );
  });
});
