import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { listAccounts, type Account } from "@/features/accounts/api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "1",
    name: "Amazon",
    description: "",
    type: "gift_card",
    expires_on: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("listAccounts", () => {
  it("returns the results page from a successful response", async () => {
    mockedApiFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [makeAccount({ name: "Starbucks" })],
        }),
        { status: 200 },
      ),
    );

    const accounts = await listAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("Starbucks");
    expect(mockedApiFetch).toHaveBeenCalledWith("/v1/accounts");
  });

  it("throws when the response is not ok", async () => {
    mockedApiFetch.mockResolvedValueOnce(new Response("", { status: 403 }));

    await expect(listAccounts()).rejects.toThrow(
      "Failed to load accounts (403)",
    );
  });
});
