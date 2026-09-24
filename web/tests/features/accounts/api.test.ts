import { describe, expect, it, vi } from "vitest";
import { ApiError, request } from "@/lib/api";
import { listAccounts, type Account } from "@/features/accounts/api";
import { makeAccount } from "./factories";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  request: vi.fn(),
}));

const mockedRequest = vi.mocked(request);

function page(results: Account[], next: string | null = null) {
  return { count: results.length, next, previous: null, results };
}

describe("listAccounts", () => {
  it("returns the results from a single page", async () => {
    mockedRequest.mockResolvedValueOnce(
      page([makeAccount({ name: "Starbucks" })]),
    );

    const accounts = await listAccounts();

    expect(accounts.map((account) => account.name)).toEqual(["Starbucks"]);
    expect(mockedRequest).toHaveBeenCalledWith("GET", "/v1/accounts");
  });

  it("propagates request failures", async () => {
    mockedRequest.mockRejectedValueOnce(new ApiError("Forbidden", 403));

    await expect(listAccounts()).rejects.toMatchObject({ status: 403 });
  });

  it("follows pagination to collect every page", async () => {
    const nextPage = "http://localhost:8000/v1/accounts?page=2";
    mockedRequest
      .mockResolvedValueOnce(
        page([makeAccount({ id: "1", name: "Starbucks" })], nextPage),
      )
      .mockResolvedValueOnce(page([makeAccount({ id: "2", name: "Amazon" })]));

    const accounts = await listAccounts();

    expect(accounts.map((account) => account.name)).toEqual([
      "Starbucks",
      "Amazon",
    ]);
    expect(mockedRequest).toHaveBeenNthCalledWith(1, "GET", "/v1/accounts");
    expect(mockedRequest).toHaveBeenNthCalledWith(2, "GET", nextPage);
  });
});
