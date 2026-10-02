import { describe, expect, it, vi } from "vitest";
import { request } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import {
  createTransaction,
  listTransactions,
  updateTransaction,
} from "@/features/transactions/api";
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

describe("createTransaction", () => {
  const input = {
    amount: "-4.75",
    description: "Latte",
    occurred_on: "2026-09-28",
  };

  it("posts the new transaction to its account", async () => {
    const transaction = makeTransaction(input);
    mockedRequest.mockResolvedValueOnce(transaction);

    await expect(createTransaction("42", input)).resolves.toEqual(transaction);
    expect(mockedRequest).toHaveBeenCalledWith(
      "POST",
      "/v1/accounts/42/transactions",
      { body: JSON.stringify(input) },
    );
  });

  it("propagates request failures", async () => {
    mockedRequest.mockRejectedValueOnce(new ApiError("Bad request", 400));

    await expect(createTransaction("42", input)).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("updateTransaction", () => {
  const changes = { description: "Mocha" };

  it("patches the changed fields of the transaction", async () => {
    const transaction = makeTransaction(changes);
    mockedRequest.mockResolvedValueOnce(transaction);

    await expect(updateTransaction("42", "7", changes)).resolves.toEqual(
      transaction,
    );
    expect(mockedRequest).toHaveBeenCalledWith(
      "PATCH",
      "/v1/accounts/42/transactions/7",
      { body: JSON.stringify(changes) },
    );
  });

  it("propagates request failures", async () => {
    mockedRequest.mockRejectedValueOnce(new ApiError("Bad request", 400));

    await expect(updateTransaction("42", "7", changes)).rejects.toMatchObject({
      status: 400,
    });
  });
});
