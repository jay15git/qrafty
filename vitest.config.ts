import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const pkg = (subpath: string) =>
  fileURLToPath(new URL(`./packages/qr/src/${subpath}`, import.meta.url));

const qrAliases = [
  { find: "@new-qr/qr-internal/codegen", replacement: pkg("scene/codegen/index.ts") },
  { find: "@new-qr/qr-internal/export", replacement: pkg("scene/export/index.ts") },
  { find: "@new-qr/qr-internal/scene", replacement: pkg("scene/index.ts") },
  { find: "@new-qr/qr-internal/react-qr-code", replacement: pkg("react-qr-code/index.ts") },
  { find: "@new-qr/qr-internal/bitjson-vendor", replacement: pkg("bitjson-vendor/runtime.js") },
  { find: "@new-qr/qr-internal/web-component", replacement: pkg("web-component/index.ts") },
  { find: "@new-qr/qr-internal/core", replacement: pkg("core/index.ts") },
  { find: "@new-qr/qr/animated", replacement: pkg("animated/index.ts") },
  { find: "@new-qr/qr/shaders", replacement: pkg("shaders/index.ts") },
  { find: "@new-qr/qr/react", replacement: pkg("react/index.ts") },
  { find: "@new-qr/qr", replacement: pkg("index.ts") },
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
      ".portable-compose-editor/**",
      ".external/**",
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
        inline: ["@new-qr/qr"],
      },
    },
  },
});
