import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { describeExpiry, isExpired } from "@/features/accounts/format";

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

describe("describeExpiry", () => {
  it("reports no expiration when there is no date", () => {
    expect(describeExpiry(null)).toEqual({
      label: "No expiration",
      expired: false,
    });
  });

  it("formats a future date as expiring", () => {
    expect(describeExpiry("2027-01-01")).toEqual({
      label: "Expires Jan 1, 2027",
      expired: false,
    });
  });

  it("formats a past date as expired", () => {
    expect(describeExpiry("2026-01-01")).toEqual({
      label: "Expired Jan 1, 2026",
      expired: true,
    });
  });
});
