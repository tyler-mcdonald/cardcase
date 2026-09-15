import { describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/api";
import { listAccounts } from "@/features/accounts/api";
import { makeAccount } from "./factories";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

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

  it("follows pagination to collect every page", async () => {
    mockedApiFetch
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            count: 2,
            next: "http://localhost:8000/v1/accounts?page=2",
            previous: null,
            results: [makeAccount({ id: "1", name: "Starbucks" })],
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            count: 2,
            next: null,
            previous: "http://localhost:8000/v1/accounts",
            results: [makeAccount({ id: "2", name: "Amazon" })],
          }),
          { status: 200 },
        ),
      );

    const accounts = await listAccounts();

    expect(accounts.map((account) => account.name)).toEqual([
      "Starbucks",
      "Amazon",
    ]);
    expect(mockedApiFetch).toHaveBeenNthCalledWith(1, "/v1/accounts");
    expect(mockedApiFetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/v1/accounts?page=2",
    );
  });
});
