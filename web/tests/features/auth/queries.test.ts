import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import { authErrorMessage, GENERIC_ERROR } from "@/features/auth/queries";

describe("authErrorMessage", () => {
  it("returns the specific message from an ApiError's body", () => {
    const error = new ApiError("Bad Request", 400, {
      status: 400,
      errors: [{ message: "Incorrect code." }],
    });

    expect(authErrorMessage(error)).toBe("Incorrect code.");
  });

  it("falls back to a generic message for an ApiError with no body message", () => {
    const error = new ApiError("Server Error", 500);

    expect(authErrorMessage(error)).toBe(GENERIC_ERROR);
  });

  it("falls back to a generic message for a non-ApiError", () => {
    expect(authErrorMessage(new Error("network down"))).toBe(GENERIC_ERROR);
  });
});
