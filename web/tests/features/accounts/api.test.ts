import { describe, expect, it, vi } from "vitest";
import { ApiError, request } from "@/lib/api";
import { listAccounts } from "@/features/accounts/api";
import { makeAccount } from "./factories";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
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
