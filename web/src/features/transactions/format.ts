const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function splitAmount(amount: string): {
  outflow: string | null;
  inflow: string | null;
} {
  const value = Number(amount);
  const formatted = currencyFormatter.format(Math.abs(value));
  if (value < 0) return { outflow: formatted, inflow: null };
  if (value > 0) return { outflow: null, inflow: formatted };
  return { outflow: null, inflow: null };
}
