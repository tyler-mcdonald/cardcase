import { formatDate, localDateString } from "@/lib/format";

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
