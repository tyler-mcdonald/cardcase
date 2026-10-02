import { describe, expect, it } from "vitest";
import { formatOutflowAndInflow } from "@/features/transactions/format";

describe("formatOutflowAndInflow", () => {
  it("puts a negative amount under outflow", () => {
    expect(formatOutflowAndInflow("-1234.5")).toEqual({
      outflow: "$1,234.50",
      inflow: null,
    });
  });

  it("puts a positive amount under inflow", () => {
    expect(formatOutflowAndInflow("25.00")).toEqual({
      outflow: null,
      inflow: "$25.00",
    });
  });

  it("leaves a zero amount out of both columns", () => {
    expect(formatOutflowAndInflow("0.00")).toEqual({
      outflow: null,
      inflow: null,
    });
  });
});
