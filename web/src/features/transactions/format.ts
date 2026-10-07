import { formatCurrency } from "@/lib/format";

/**
 * Splits a signed amount into an unsigned outflow (negative amounts) or
 * inflow (positive amounts); the other side, or both for zero, is null.
 */
export function splitSignedAmount(amount: string): {
  outflow: number | null;
  inflow: number | null;
} {
  const value = Number(amount);
  const magnitude = Math.abs(value);
  if (value < 0) return { outflow: magnitude, inflow: null };
  if (value > 0) return { outflow: null, inflow: magnitude };
  return { outflow: null, inflow: null };
}

function formatMagnitude(magnitude: number | null): string | null {
  return magnitude === null ? null : formatCurrency(magnitude);
}

export function formatOutflowAndInflow(amount: string): {
  outflow: string | null;
  inflow: string | null;
} {
  const { outflow, inflow } = splitSignedAmount(amount);
  return { outflow: formatMagnitude(outflow), inflow: formatMagnitude(inflow) };
}
