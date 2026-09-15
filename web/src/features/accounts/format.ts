const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function isExpired(expiresOn: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return expiresOn < today;
}

export function formatExpiry(expiresOn: string | null): string {
  if (!expiresOn) {
    return "No expiration";
  }
  const formatted = dateFormatter.format(new Date(`${expiresOn}T00:00:00Z`));
  return isExpired(expiresOn) ? `Expired ${formatted}` : `Expires ${formatted}`;
}
