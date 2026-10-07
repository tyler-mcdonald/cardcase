import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  describeBalance,
  describeExpiry,
  isExpired,
} from "@/features/accounts/format";

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

describe("describeBalance", () => {
  it("formats a positive balance as dollars", () => {
    expect(describeBalance("1234.5")).toEqual({
      label: "$1,234.50",
      negative: false,
    });
  });

  it("formats a zero balance as $0.00", () => {
    expect(describeBalance("0.00")).toEqual({
      label: "$0.00",
      negative: false,
    });
  });

  it("formats a negative zero balance as $0.00", () => {
    expect(describeBalance("-0.00")).toEqual({
      label: "$0.00",
      negative: false,
    });
  });

  it("formats a negative balance with a minus sign", () => {
    expect(describeBalance("-12.34")).toEqual({
      label: "-$12.34",
      negative: true,
    });
  });
});
