#!/usr/bin/env node
/**
 * Check if a package version is already published on npm.
 *
 * This module provides both a CLI tool and programmatic API to verify
 * whether a specific package version exists on the npm registry.
 * Useful in CI/CD pipelines to prevent duplicate publishing attempts.
 *
 * ## CLI Usage
 *
 * ```bash
 * # Using scoped package name
 * node check-published @zig-wasm/crypto
 *
 * # Using short name (resolves to packages/crypto)
 * node check-published crypto
 *
 * # Using relative path
 * node check-published ./packages/crypto
 * ```
 *
 * Exit codes:
 * - `0` - Package version is published
 * - `1` - Package version is NOT published
 * - `2` - Error occurred (e.g., network failure)
 *
 * ## Programmatic Usage
 *
 * @example Basic usage
 * ```ts
 * import { checkPublished } from "@zig-wasm/tooling";
 *
 * const result = await checkPublished("@zig-wasm/crypto");
 * console.log(result);
 * // { name: "@zig-wasm/crypto", version: "1.0.0", published: true }
 * ```
 *
 * @example CI/CD integration
 * ```ts
 * import { checkPublished } from "@zig-wasm/tooling";
 *
 * const { name, version, published } = await checkPublished("crypto");
 * if (published) {
 *   console.log(`Skipping publish: ${name}@${version} already exists`);
 *   process.exit(0);
 * }
 * // Proceed with publishing...
 * ```
 *
 * @example Error handling
 * ```ts
 * import { checkPublished } from "@zig-wasm/tooling";
 *
 * try {
 *   const result = await checkPublished("nonexistent");
 * } catch (error) {
 *   console.error("Package not found or network error");
 * }
 * ```
 *
 * @module check-published
 */

import { runCli } from "./cli.ts";
import { CHECK_PUBLISHED_USAGE, printHelp } from "./messages.ts";
import { findMonorepoRoot } from "./monorepo.ts";
import { readPackageJson, resolvePackageJsonPath } from "./paths.ts";

/**
 * Result returned by {@link checkPublished}.
 *
 * @example
 * ```ts
 * import type { CheckPublishedResult } from "@zig-wasm/tooling";
 *
 * const result: CheckPublishedResult = {
 *   name: "@zig-wasm/crypto",
 *   version: "1.0.0",
 *   published: true
 * };
 * ```
 */
export interface CheckPublishedResult {
  /** The full package name from package.json (e.g., "@zig-wasm/crypto") */
  name: string;
  /** The version string from package.json (e.g., "1.0.0") */
  version: string;
  /** Whether this exact version exists on the npm registry */
  published: boolean;
}

/**
 * Check if a package version is already published on npm.
 *
 * Reads the package.json from the specified path, extracts the name and version,
 * then queries the npm registry to check if that exact version exists.
 *
 * @param pkgPath - Package identifier in one of these formats:
 *   - Scoped name: `"@zig-wasm/crypto"` - resolves to `packages/crypto`
 *   - Short name: `"crypto"` - resolves to `packages/crypto`
 *   - Relative path: `"./packages/crypto"` - used as-is
 * @returns Promise resolving to {@link CheckPublishedResult} with name, version, and published status
 * @throws Error if package.json cannot be read or parsed
 *
 * @example Using scoped package name
 * ```ts
 * const result = await checkPublished("@zig-wasm/crypto");
 * // Reads from: packages/crypto/package.json
 * ```
 *
 * @example Using short name
 * ```ts
 * const result = await checkPublished("crypto");
 * // Reads from: packages/crypto/package.json
 * ```
 *
 * @example Using relative path
 * ```ts
 * const result = await checkPublished("./internal/tooling");
 * // Reads from: ./internal/tooling/package.json
 * ```
 */
export async function checkPublished(
  pkgPath: string,
  registryUrl: string = "https://registry.npmjs.org",
): Promise<CheckPublishedResult> {
  const packageJsonPath: string = resolvePackageJsonPath(pkgPath, findMonorepoRoot());
  const { name, version } = await readPackageJson(packageJsonPath);

  return {
    name,
    version,
    published: (await fetch(`${registryUrl}/${name}/${version}`)).ok,
  };
}

// CLI entry point
if (import.meta.main) {
  await runCli(async () => {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
      printHelp(CHECK_PUBLISHED_USAGE, "info");
      return 0;
    }

    if (!process.argv[2]) {
      printHelp(CHECK_PUBLISHED_USAGE, "error");
      return 1;
    }

    console.log(`Checking if package is published...`);

    try {
      const result = await checkPublished(process.argv[2]);
      if (result.published) {
        console.log(`✓ ${result.name}@${result.version} is published on npm`);
        return 0;
      }

      console.log(`✗ ${result.name}@${result.version} is NOT published on npm`);
      return 1;
    } catch (error) {
      console.error("Failed to check npm registry:", error);
      return 2;
    }
  });
}
