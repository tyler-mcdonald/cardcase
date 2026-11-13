function clientId(): string {
  return import.meta.env.VITE_BRANDFETCH_CLIENT_ID ?? "";
}

export function hasBrandfetchClientId() {
  return clientId() !== "";
}

export function brandfetchUrl(url: string) {
  const withClientId = new URL(url);
  withClientId.searchParams.set("c", clientId());
  return withClientId;
}
