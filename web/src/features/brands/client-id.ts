export function brandfetchClientId(): string {
  return import.meta.env.VITE_BRANDFETCH_CLIENT_ID ?? "";
}

export function hasBrandfetchClientId() {
  return brandfetchClientId() !== "";
}
