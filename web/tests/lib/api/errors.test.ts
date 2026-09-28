import { describe, expect, it } from "vitest";
import {
  apiErrorMessage,
  apiFieldErrors,
  isClientError,
  ApiError,
  GENERIC_ERROR,
} from "@/lib/api/errors";

describe("apiErrorMessage", () => {
  it("returns the specific message from an ApiError's body", () => {
    const error = new ApiError("Bad Request", 400, {
      status: 400,
      errors: [{ message: "Incorrect code." }],
    });

    expect(apiErrorMessage(error)).toBe("Incorrect code.");
  });

  it("falls back to a generic message for an ApiError with no body message", () => {
    const error = new ApiError("Server Error", 500);

    expect(apiErrorMessage(error)).toBe(GENERIC_ERROR);
  });

  it("falls back to a generic message for a non-ApiError", () => {
    expect(apiErrorMessage(new Error("network down"))).toBe(GENERIC_ERROR);
  });
});

describe("apiFieldErrors", () => {
  it("maps each field to its first message", () => {
    const error = new ApiError("Bad Request", 400, {
      name: ["Too long.", "Invalid."],
      detail: "Ignored.",
      errors: [{ message: "Ignored." }],
    });

    expect(apiFieldErrors(error)).toEqual({ name: "Too long." });
  });

  it("is empty for a non-ApiError", () => {
    expect(apiFieldErrors(new Error("boom"))).toEqual({});
  });
});

describe("isClientError", () => {
  it("is true for a 4xx API error", () => {
    expect(isClientError(new ApiError("Not found", 404))).toBe(true);
  });

  it("is false for a 5xx API error", () => {
    expect(isClientError(new ApiError("Server error", 500))).toBe(false);
  });

  it("is false for a network failure", () => {
    expect(isClientError(new ApiError("Network error"))).toBe(false);
  });

  it("is false for a non-API error", () => {
    expect(isClientError(new Error("boom"))).toBe(false);
  });
});
