import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const pkg = (subpath: string) =>
  fileURLToPath(new URL(`./packages/qr/src/${subpath}`, import.meta.url));

const qrAliases = [
  { find: "@qrafty/qr-internal/codegen", replacement: pkg("scene/codegen/index.ts") },
  { find: "@qrafty/qr-internal/export", replacement: pkg("scene/export/index.ts") },
  { find: "@qrafty/qr-internal/scene", replacement: pkg("scene/index.ts") },
  { find: "@qrafty/qr-internal/react-qr-code", replacement: pkg("react-qr-code/index.ts") },
  { find: "@qrafty/qr-internal/core", replacement: pkg("core/index.ts") },
  { find: "@qrafty/qr/dot-matrix", replacement: pkg("dot-matrix/index.ts") },
  { find: "@qrafty/qr/animated", replacement: pkg("animated/index.ts") },
  { find: "@qrafty/qr/shaders", replacement: pkg("shaders/index.ts") },
  { find: "@qrafty/qr/react", replacement: pkg("react/index.ts") },
  { find: "@qrafty/qr", replacement: pkg("index.ts") },
];

export default defineConfig({
  resolve: {
    alias: [
      { find: "@/", replacement: `${fileURLToPath(new URL(".", import.meta.url))}/` },
      ...qrAliases,
    ],
  },
  test: {
    exclude: [
      "packages/qr/vendor/**",
      "packages/qr-scene*/**",
      "node_modules/**",
      ".next/**",
      "packages/**/node_modules/**",
      "**/*.spec.js",
      "**/*.spec.ts",
    ],
    environment: "node",
    server: {
      deps: {
        inline: ["@qrafty/qr"],
      },
    },
  },
});
