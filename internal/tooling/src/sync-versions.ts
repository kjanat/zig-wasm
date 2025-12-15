#!/usr/bin/env node
/**
 * Sync versions between package.json and jsr.json for all packages.
 *
 * This module ensures version consistency across the monorepo by synchronizing
 * versions from package.json (npm source of truth) to jsr.json (JSR config).
 * It scans both `packages/` and `internal/` directories.
 *
 * ## Why This Exists
 *
 * The zig-wasm monorepo publishes to both npm and JSR. Since npm is the primary
 * registry, package.json is the source of truth for versions. This tool ensures
 * jsr.json files stay in sync, preventing version drift and failed JSR publishes.
 *
 * ## CLI Usage
 *
 * ```bash
 * # Check for mismatches (CI-friendly, exits non-zero on mismatch)
 * node sync-versions --check
 *
 * # Sync versions (updates jsr.json files)
 * node sync-versions
 * ```
 *
 * Exit codes:
 * - `0` - All versions in sync (or successfully synced)
 * - `1` - Mismatches found (with --check) or sync failed
 *
 * ## Programmatic Usage
 *
 * @example Check for mismatches without modifying files
 * ```ts
 * import { syncVersions } from "@zig-wasm/tooling";
 *
 * const result = await syncVersions({ checkOnly: true });
 * if (!result.success) {
 *   console.error(`Found ${result.mismatches} version mismatches`);
 *   process.exit(1);
 * }
 * ```
 *
 * @example Sync versions and report changes
 * ```ts
 * import { syncVersions } from "@zig-wasm/tooling";
 *
 * const result = await syncVersions();
 * if (result.synced.length > 0) {
 *   console.log("Updated packages:", result.synced.join(", "));
 * }
 * ```
 *
 * @example Start search from a subdirectory
 * ```ts
 * import { syncVersions } from "@zig-wasm/tooling";
 *
 * // Finds monorepo root by walking up from the given path
 * const result = await syncVersions({
 *   cwd: "/path/to/zig-wasm/packages/core",
 *   checkOnly: false
 * });
 * ```
 *
 * @module sync-versions
 */

import { existsSync, readdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { runCli } from "./cli.ts";
import { printHelp, SYNC_VERSIONS_USAGE } from "./messages.ts";
import { findMonorepoRoot } from "./monorepo.ts";
import { readPackageJson } from "./paths.ts";

/**
 * Internal representation of package.json structure.
 * @internal
 */
interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

/**
 * Internal representation of jsr.json structure.
 * @internal
 */
interface JsrJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

/**
 * Options for {@link syncVersions}.
 *
 * @example
 * ```ts
 * import type { SyncVersionsOptions } from "@zig-wasm/tooling";
 *
 * const options: SyncVersionsOptions = {
 *   checkOnly: true,  // Don't modify files
 *   cwd: process.cwd()
 * };
 * ```
 */
export interface SyncVersionsOptions {
  /**
   * Only report differences without modifying files.
   * Useful for CI checks.
   * @default false
   */
  checkOnly?: boolean;
  /**
   * Starting directory to search for the monorepo root.
   * The tool walks up from this directory to find `pnpm-workspace.yaml`,
   * then operates from that root (ignoring the original cwd for resolution).
   * @default process.cwd()
   */
  cwd?: string;
}

/**
 * Result returned by {@link syncVersions}.
 *
 * @example
 * ```ts
 * import type { SyncVersionsResult } from "@zig-wasm/tooling";
 *
 * const result: SyncVersionsResult = {
 *   success: true,
 *   mismatches: 2,
 *   synced: ["@zig-wasm/crypto", "@zig-wasm/hash"]
 * };
 * ```
 */
export interface SyncVersionsResult {
  /**
   * Whether the operation succeeded.
   * - With `checkOnly: true`: true if no mismatches found
   * - With `checkOnly: false`: true if all mismatches were synced
   */
  success: boolean;
  /** Number of version mismatches found between package.json and jsr.json */
  mismatches: number;
  /** List of package names that were synced (empty if checkOnly) */
  synced: string[];
}

/**
 * Sync versions between package.json and jsr.json for all packages.
 *
 * Scans `packages/` and `internal/` directories, comparing versions in
 * package.json and jsr.json. When mismatches are found:
 * - With `checkOnly: true`: Reports mismatches and returns failure
 * - With `checkOnly: false`: Updates jsr.json to match package.json
 *
 * @param options - Configuration options (see {@link SyncVersionsOptions})
 * @returns Promise resolving to {@link SyncVersionsResult}
 *
 * @example Basic sync
 * ```ts
 * const result = await syncVersions();
 * console.log(`Synced ${result.synced.length} packages`);
 * ```
 *
 * @example CI check mode
 * ```ts
 * const result = await syncVersions({ checkOnly: true });
 * process.exit(result.success ? 0 : 1);
 * ```
 */
export async function syncVersions(options: SyncVersionsOptions = {}): Promise<SyncVersionsResult> {
  const startPath = options.cwd ?? process.cwd();
  const monorepoRoot = findMonorepoRoot(startPath);
  const { checkOnly = false } = options;
  const cwd = monorepoRoot;
  const packagesDir = resolve(cwd, "packages");
  const internalDir = resolve(cwd, "internal");

  let mismatches = 0;
  const synced: string[] = [];

  async function syncDir(baseDir: string): Promise<void> {
    let dirs: string[] = [];

    try {
      const entries = readdirSync(baseDir, { withFileTypes: true });
      dirs = entries.filter((d) => d.isDirectory()).map((d) => join(baseDir, d.name));
    } catch {
      return;
    }

    for (const dir of dirs) {
      const packageJsonPath = join(dir, "package.json");
      const jsrJsonPath = join(dir, "jsr.json");

      try {
        if (!existsSync(packageJsonPath) || !existsSync(jsrJsonPath)) {
          continue;
        }

        const packageJson = (await readPackageJson(packageJsonPath)) as PackageJson;
        const jsrJson = JSON.parse(await readFile(jsrJsonPath, "utf-8")) as JsrJson;

        const npmVersion = packageJson.version;
        const jsrVersion = jsrJson.version;
        const dirName = dir.split("/").slice(-1)[0] || dir;

        if (npmVersion !== jsrVersion) {
          mismatches++;
          console.warn(
            `⚠ ${packageJson.name} version mismatch: package.json=${npmVersion}, jsr.json=${jsrVersion}`,
          );

          if (!checkOnly) {
            jsrJson.version = npmVersion;
            await writeFile(jsrJsonPath, `${JSON.stringify(jsrJson, null, 2)}\n`);
            console.log(`✓ Updated ${dirName}/jsr.json to v${npmVersion}`);
            synced.push(packageJson.name);
          }
        } else {
          console.log(`✓ ${packageJson.name}@${npmVersion} is in sync`);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error(`Error processing ${dir}:`, error);
        }
      }
    }
  }

  console.log("Syncing package versions...\n");
  await syncDir(packagesDir);
  console.log();
  await syncDir(internalDir);

  const success = mismatches === 0 || (!checkOnly && synced.length === mismatches);

  if (mismatches > 0 && checkOnly) {
    console.log("\nRun without --check to fix these mismatches");
  } else {
    console.log("\n✓ All versions are in sync!");
  }

  return { success, mismatches, synced };
}

// CLI entry point
if (import.meta.main) {
  await runCli(async () => {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
      printHelp(SYNC_VERSIONS_USAGE);
      return 0;
    }

    const checkOnly = process.argv.includes("--check");
    const result = await syncVersions({ checkOnly });
    return result.success ? 0 : 1;
  });
}
