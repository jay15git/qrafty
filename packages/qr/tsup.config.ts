import { defineConfig, type Options } from "tsup";

const shared: Partial<Options> = {
  format: ["esm"],
  splitting: false,
  sourcemap: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@paper-design/shaders",
    "@paper-design/shaders-react",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
};

const publicEntries = {
  index: "src/index.ts",
  react: "src/react/index.ts",
  shaders: "src/shaders/index.ts",
};

export default defineConfig({
  ...shared,
  entry: publicEntries,
  clean: true,
  dts: false,
} as Options);
