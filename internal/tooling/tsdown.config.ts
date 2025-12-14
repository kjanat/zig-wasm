import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  outDir: "dist",
  clean: true,
  unbundle: true,
  dts: true,
  banner: `/**
 * @package "@zig-wasm/tooling"
 * @license MIT
 */
`,
});
