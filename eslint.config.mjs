import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored + generated trees are not linted:
    "packages/qr/vendor/**",
    "packages/qr/dist/**",
    ".agents/**",
    ".claude/**",
    "docs/superpowers/**",
  ]),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "framer-motion",
              message:
                "Use `motion/react` — framer-motion was removed in favor of the `motion` package.",
            },
            {
              name: "cn",
              message: "Use `cn` from `@/lib/utils`, not the `cn` package.",
            },
            {
              name: "qrcode.react",
              message: "Use the vendored `ReactQRCode` from `@qrafty/qr-internal/react-qr-code`.",
            },
          ],
          patterns: [
            {
              group: ["@radix-ui/*"],
              message: "Import primitives from the `radix-ui` meta-package instead.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
