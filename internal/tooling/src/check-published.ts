#!/usr/bin/env bun
/**
 * Check if a package version is already published on npm
 *
 * Usage:
 *   CLI: `bun check-published @zig-wasm/crypto`
 *   Programmatic: `import { checkPublished } from "@zig-wasm/tooling"`
 */

import { resolve } from "node:path";

export interface CheckPublishedResult {
  name: string;
  version: string;
  published: boolean;
}

/**
 * Check if a package version is already published on npm
 * @param pkgPath - Package path or name (e.g., "crypto", "@zig-wasm/crypto", "./packages/crypto")
 * @returns Object with name, version, and published status
 */
export async function checkPublished(pkgPath: string): Promise<CheckPublishedResult> {
  // Resolve path - support both @scope/name and relative paths
  let packageJsonPath: string;

  if (pkgPath.startsWith("@")) {
    // Handle @scope/name
    const scopedName = pkgPath.split("/")[1] ?? pkgPath;
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
}
