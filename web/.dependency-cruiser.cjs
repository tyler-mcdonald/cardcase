/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-direct-http-client",
      comment: "Only a feature's api.ts may import lib/api/client.ts",
      severity: "error",
      from: { pathNot: "^src/features/[^/]+/api\\.ts$" },
      to: { path: "^src/lib/api/client\\.ts$" },
    },
    {
      name: "no-direct-feature-api-import",
      comment:
        "Only a feature's own queries.ts may import that feature's api.ts",
      severity: "error",
      from: { pathNot: "^src/features/[^/]+/queries\\.ts$" },
      to: { path: "^src/features/[^/]+/api\\.ts$" },
    },
    {
      name: "no-cross-feature-api-import",
      comment:
        "queries.ts may only import its own feature's api.ts, never another feature's",
      severity: "error",
      from: { path: "^src/features/([^/]+)/queries\\.ts$" },
      to: {
        path: "^src/features/[^/]+/api\\.ts$",
        pathNot: "^src/features/$1/api\\.ts$",
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.app.json" },
    tsPreCompilationDeps: true,
  },
};
