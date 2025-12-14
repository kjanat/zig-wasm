#!/usr/bin/env bun
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
 * bun check-published @zig-wasm/crypto
 *
 * # Using short name (resolves to packages/crypto)
 * bun check-published crypto
 *
 * # Using relative path
 * bun check-published ./packages/crypto
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

import { resolve } from "node:path";

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
export async function checkPublished(pkgPath: string): Promise<CheckPublishedResult> {
  // Resolve path - support both @scope/name and relative paths
  let packageJsonPath: string;

  if (pkgPath.startsWith("@")) {
    // Handle @scope/name - extract package name after the scope
    const scopedName = pkgPath.split("/")[1] || pkgPath;
    packageJsonPath = resolve(process.cwd(), "packages", scopedName, "package.json");
  } else if (pkgPath.startsWith(".")) {
    // Handle relative paths
    packageJsonPath = resolve(process.cwd(), pkgPath, "package.json");
  } else {
    // Handle package name without scope
    packageJsonPath = resolve(process.cwd(), "packages", pkgPath, "package.json");
  }

  const file = Bun.file(packageJsonPath);
  const packageJson = (await file.json()) as { name: string; version: string };
  const { name, version } = packageJson;

  const npmResponse = await fetch(`https://registry.npmjs.org/${name}/${version}`);

  return {
    name,
    version,
    published: npmResponse.ok,
  };
}

// CLI entry point
if (import.meta.main) {
  (async () => {
    const pkgPath = Bun.argv[2];

    if (!pkgPath) {
      console.error("Usage: check-published <package-path-or-name>");
      console.error("Examples: check-published crypto, check-published @zig-wasm/crypto");
      process.exit(1);
    }

    console.log(`Checking if package is published...`);

    try {
      const result = await checkPublished(pkgPath);
      if (result.published) {
        console.log(`\u2713 ${result.name}@${result.version} is published on npm`);
        process.exit(0);
      } else {
        console.log(`\u2717 ${result.name}@${result.version} is NOT published on npm`);
        process.exit(1);
      }
    } catch (error) {
      console.error("Failed to check npm registry:", error);
      process.exit(2);
    }
  })();
}
