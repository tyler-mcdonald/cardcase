import type { MantineColorScheme } from "@mantine/core";

const STORAGE_KEY = "mantine-color-scheme-value";

export function setStoredColorScheme(scheme: MantineColorScheme) {
  window.localStorage.setItem(STORAGE_KEY, scheme);
}

export function storedColorScheme() {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function resetColorScheme() {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
}
