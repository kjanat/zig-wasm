import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    crypto: "src/crypto.ts",
    hash: "src/hash.ts",
    base64: "src/base64.ts",
    math: "src/math.ts",
    compress: "src/compress.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false,
});
