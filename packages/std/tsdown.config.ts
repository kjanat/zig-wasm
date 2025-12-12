import { defineConfig } from "tsdown";
import { baseConfig } from "../../tsdown.config.ts";

// Umbrella package with multiple entry points for subpath exports
export default defineConfig({
  ...baseConfig,
  entry: {
    index: "src/index.ts",
    crypto: "src/crypto.ts",
    hash: "src/hash.ts",
    base64: "src/base64.ts",
    math: "src/math.ts",
    compress: "src/compress.ts",
  },
  exports: {
    customExports(pkg) {
      // Re-export WASM files from individual packages
      pkg["./crypto.wasm"] = "@zig-wasm/crypto/crypto.wasm";
      pkg["./hash.wasm"] = "@zig-wasm/hash/hash.wasm";
      pkg["./base64.wasm"] = "@zig-wasm/base64/base64.wasm";
      pkg["./math.wasm"] = "@zig-wasm/math/math.wasm";
      pkg["./compress.wasm"] = "@zig-wasm/compress/compress.wasm";
      return pkg;
    },
  },
});
