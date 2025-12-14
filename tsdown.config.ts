import { codecovRollupPlugin } from "@codecov/rollup-plugin";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type UserConfig } from "tsdown";

/**
 * Get Codecov bundle analysis plugin if token is available.
 */
export function getCodecovPlugin(bundleName: string) {
  const token = process.env.CODECOV_TOKEN;
  if (!token) return [];

  return [
    codecovRollupPlugin({
      enableBundleAnalysis: true,
      bundleName,
      uploadToken: token,
    }),
  ];
}

/**
 * Shared build options for all packages.
 * Import and spread into per-package configs.
 */
export const baseConfig: UserConfig = {
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: false, // Preserve .wasm files from Zig build
  sourcemap: true,
  treeshake: true,
  exports: true,
  publint: true,
  external: ["@zig-wasm/tooling"], // Don't bundle tooling into packages
};

/**
 * Config for packages with WASM files.
 * Adds .wasm to exports field and codecov plugin.
 * Also updates jsr.json to include wasm exports.
 */
export function wasmConfig(packageName: string): UserConfig {
  // Update jsr.json with wasm exports
  const jsrPath = join(process.cwd(), "jsr.json");
  try {
    const jsrContent = readFileSync(jsrPath, "utf-8");
    const jsrConfig = JSON.parse(jsrContent);

    // Convert exports to object format if it's a string
    jsrConfig.exports = {
      ".": typeof jsrConfig.exports === "string" ? jsrConfig.exports : "./src/index.ts",
      [`./${packageName}.wasm`]: `./wasm/${packageName}.wasm`,
    };

    writeFileSync(jsrPath, JSON.stringify(jsrConfig, null, 2) + "\n");
  } catch (err) {
    console.warn(`Failed to update jsr.json for ${packageName}:`, err);
  }

  return {
    ...baseConfig,
    plugins: getCodecovPlugin(`@zig-wasm/${packageName}`),
    exports: {
      customExports(pkg) {
        pkg[`./${packageName}.wasm`] = `./wasm/${packageName}.wasm`;
        return pkg;
      },
    },
  };
}

/**
 * Config for non-WASM packages with codecov plugin.
 */
export function packageConfig(packageName: string): UserConfig {
  return {
    ...baseConfig,
    plugins: getCodecovPlugin(`@zig-wasm/${packageName}`),
  };
}

/**
 * Root tsdown configuration for workspace builds.
 * Run with: pnpm build:ts (tsdown --workspace)
 */
export default defineConfig({
  workspace: {
    include: "packages/*",
  },
});
