import { defineConfig } from "tsdown";
import { baseConfig, getCodecovPlugin } from "../../tsdown.config.ts";

// Umbrella package with multiple entry points for subpath exports
export default defineConfig({
  ...baseConfig,
  plugins: getCodecovPlugin("@zig-wasm/std"),
  entry: {
    index: "src/index.ts",
    crypto: "src/crypto.ts",
    hash: "src/hash.ts",
    base64: "src/base64.ts",
    math: "src/math.ts",
    compress: "src/compress.ts",
  },
});
