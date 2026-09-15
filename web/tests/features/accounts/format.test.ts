import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatExpiry, isExpired } from "@/features/accounts/format";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isExpired", () => {
  it("returns true for a date in the past", () => {
    expect(isExpired("2026-01-01")).toBe(true);
  });

  it("returns false for a date in the future", () => {
    expect(isExpired("2027-01-01")).toBe(false);
  });

  it("returns false for today", () => {
    expect(isExpired("2026-06-15")).toBe(false);
  });
});

describe("formatExpiry", () => {
  it("reports no expiration when there is no date", () => {
    expect(formatExpiry(null)).toBe("No expiration");
  });

  it("formats a future date as expiring", () => {
    expect(formatExpiry("2027-01-01")).toBe("Expires Jan 1, 2027");
  });

  it("formats a past date as expired", () => {
    expect(formatExpiry("2026-01-01")).toBe("Expired Jan 1, 2026");
  });
});
