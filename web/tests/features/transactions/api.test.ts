import { describe, expect, it, vi } from "vitest";
import { request } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { listTransactions } from "@/features/transactions/api";
import { makeTransaction } from "./factories";

vi.mock("@/lib/api/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/client")>()),
  request: vi.fn(),
}));

const mockedRequest = vi.mocked(request);

describe("listTransactions", () => {
  it("requests the given page of transactions", async () => {
    const response = {
      count: 1,
      next: null,
      previous: null,
      results: [makeTransaction()],
    };
    mockedRequest.mockResolvedValueOnce(response);

    await expect(listTransactions(2)).resolves.toEqual(response);
    expect(mockedRequest).toHaveBeenCalledWith(
      "GET",
      "/v1/transactions?page=2",
    );
  });

  it("propagates request failures", async () => {
    mockedRequest.mockRejectedValueOnce(new ApiError("Forbidden", 403));

    await expect(listTransactions(1)).rejects.toMatchObject({ status: 403 });
  });
});
