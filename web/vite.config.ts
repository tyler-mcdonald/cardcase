import path from "node:path";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

function hasBrandfetchClientId(mode: string): boolean {
  return Boolean(
    loadEnv(mode, import.meta.dirname, "VITE_").VITE_BRANDFETCH_CLIENT_ID,
  );
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === "build" && !hasBrandfetchClientId(mode)) {
    throw new Error("VITE_BRANDFETCH_CLIENT_ID must be set to build");
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      port: 3000,
    },
    test: {
      alias: {
        "@tests": path.resolve(import.meta.dirname, "./tests"),
      },
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      mockReset: true,
      unstubEnvs: true,
      unstubGlobals: true,
      testTimeout: 15_000,
      env: {
        VITE_API_URL: "http://api.test",
      },
    },
  };
});
