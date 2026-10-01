import { describe, expect, it } from "vitest";
import { splitAmount } from "@/features/transactions/format";

describe("splitAmount", () => {
  it("puts a negative amount under outflow", () => {
    expect(splitAmount("-1234.5")).toEqual({
      outflow: "$1,234.50",
      inflow: null,
    });
  });

  it("puts a positive amount under inflow", () => {
    expect(splitAmount("25.00")).toEqual({ outflow: null, inflow: "$25.00" });
  });
});
