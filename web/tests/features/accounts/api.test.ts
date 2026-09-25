import { describe, expect, it, vi } from "vitest";
import { request } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { createAccount, listAccounts } from "@/features/accounts/api";
import { makeAccount } from "./factories";

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  request: vi.fn(),
}));

const mockedRequest = vi.mocked(request);

describe("listAccounts", () => {
  it("requests the given page of accounts", async () => {
    const response = {
      count: 1,
      next: null,
      previous: null,
      results: [makeAccount({ name: "Starbucks" })],
    };
    mockedRequest.mockResolvedValueOnce(response);

    await expect(listAccounts(2)).resolves.toEqual(response);
    expect(mockedRequest).toHaveBeenCalledWith("GET", "/v1/accounts?page=2");
  });

  it("propagates request failures", async () => {
    mockedRequest.mockRejectedValueOnce(new ApiError("Forbidden", 403));

    await expect(listAccounts(1)).rejects.toMatchObject({ status: 403 });
  });
});

describe("createAccount", () => {
  const input = {
    name: "Starbucks",
    type: "gift_card" as const,
    description: "",
    expires_on: "2026-12-31",
  };

  it("posts the new account", async () => {
    const account = makeAccount(input);
    mockedRequest.mockResolvedValueOnce(account);

    await expect(createAccount(input)).resolves.toEqual(account);
    expect(mockedRequest).toHaveBeenCalledWith("POST", "/v1/accounts", {
      body: JSON.stringify(input),
    });
  });

  it("propagates request failures", async () => {
    mockedRequest.mockRejectedValueOnce(new ApiError("Bad request", 400));

    await expect(createAccount(input)).rejects.toMatchObject({ status: 400 });
  });
});
