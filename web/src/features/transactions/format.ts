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
  return value < 0
    ? { outflow: formatted, inflow: null }
    : { outflow: null, inflow: formatted };
}
