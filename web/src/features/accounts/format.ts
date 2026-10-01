import { formatDate } from "@/lib/format";

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
