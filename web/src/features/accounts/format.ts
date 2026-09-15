const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isExpired(expiresOn: string): boolean {
  return expiresOn < localDateString(new Date());
}

export function formatExpiry(
  expiresOn: string | null,
  expired = expiresOn ? isExpired(expiresOn) : false,
): string {
  if (!expiresOn) {
    return "No expiration";
  }
  const formatted = dateFormatter.format(new Date(`${expiresOn}T00:00:00Z`));
  return expired ? `Expired ${formatted}` : `Expires ${formatted}`;
}
