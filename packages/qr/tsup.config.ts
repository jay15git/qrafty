import { defineConfig } from "tsup"

const shared = {
  format: ["esm"] as const,
  splitting: false,
  sourcemap: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@paper-design/shaders",
    "@paper-design/shaders-react",
  ],
  esbuildOptions(options: { jsx?: string }) {
    options.jsx = "automatic"
  },
}

const publicEntries = {
  index: "src/index.ts",
  react: "src/react/index.ts",
  shaders: "src/shaders/index.ts",
  animated: "src/animated/index.ts",
}

export default defineConfig({
  ...shared,
  entry: publicEntries,
  clean: true,
  dts: false,
})
