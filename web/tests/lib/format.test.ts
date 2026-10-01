import { describe, expect, it } from "vitest";
import { formatDate } from "@/lib/format";

describe("formatDate", () => {
  it("formats an ISO date without shifting it across time zones", () => {
    expect(formatDate("2027-01-01")).toBe("Jan 1, 2027");
  });
});
