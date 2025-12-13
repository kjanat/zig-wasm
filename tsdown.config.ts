import { defineConfig, type UserConfig } from "tsdown";

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
  unused: true,
};

/**
 * Config for packages with WASM files.
 * Adds .wasm to exports field.
 */
export function wasmConfig(wasmName: string): UserConfig {
  return {
    ...baseConfig,
    exports: {
      customExports(pkg) {
        pkg[`./${wasmName}.wasm`] = `./dist/${wasmName}.wasm`;
        return pkg;
      },
    },
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
