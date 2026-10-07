import { formatDate, localDateString } from "@/lib/format";

const balanceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function describeBalance(balance: string): {
  label: string;
  negative: boolean;
} {
  const value = Number(balance) || 0;
  return { label: balanceFormatter.format(value), negative: value < 0 };
}

export function isExpired(expiresOn: string | null): boolean {
  return expiresOn !== null && expiresOn < localDateString(new Date());
}

export function describeExpiry(expiresOn: string | null): {
  label: string;
  expired: boolean;
} {
  if (!expiresOn) {
    return { label: "No expiration", expired: false };
  }
  const formatted = formatDate(expiresOn);
  const expired = isExpired(expiresOn);
  return {
    label: expired ? `Expired ${formatted}` : `Expires ${formatted}`,
    expired,
  };
}
