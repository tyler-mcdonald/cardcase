import { describe, expect, it } from "vitest";
import {
  describeSignedAmount,
  formatOutflowAndInflow,
} from "@/features/transactions/format";

describe("describeSignedAmount", () => {
  it("labels a negative amount as an outflow with a minus sign", () => {
    expect(describeSignedAmount("-24.99")).toEqual({
      label: "-$24.99",
      inflow: false,
    });
  });

  it("labels a positive amount as an inflow with a plus sign", () => {
    expect(describeSignedAmount("310")).toEqual({
      label: "+$310.00",
      inflow: true,
    });
  });

  it("labels a zero amount without a sign", () => {
    expect(describeSignedAmount("0.00")).toEqual({
      label: "$0.00",
      inflow: false,
    });
  });
});

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
