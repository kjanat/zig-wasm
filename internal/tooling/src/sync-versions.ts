#!/usr/bin/env bun
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
 * bun sync-versions --check
 *
 * # Sync versions (updates jsr.json files)
 * bun sync-versions
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
 * @example Custom working directory
 * ```ts
 * import { syncVersions } from "@zig-wasm/tooling";
 *
 * const result = await syncVersions({
 *   cwd: "/path/to/zig-wasm",
 *   checkOnly: false
 * });
 * ```
 *
 * @module sync-versions
 */

import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

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
   * Base directory containing `packages/` and `internal/` folders.
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
  const { checkOnly = false, cwd = process.cwd() } = options;
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
        const packageFile = Bun.file(packageJsonPath);
        const jsrFile = Bun.file(jsrJsonPath);

        if (!(await packageFile.exists()) || !(await jsrFile.exists())) {
          continue;
        }

        const packageJson = (await packageFile.json()) as PackageJson;
        const jsrJson = (await jsrFile.json()) as JsrJson;

        const npmVersion = packageJson.version;
        const jsrVersion = jsrJson.version;
        const dirName = dir.split("/").slice(-1)[0] || dir;

        if (npmVersion !== jsrVersion) {
          mismatches++;
          console.warn(
            `\u26A0 ${packageJson.name} version mismatch: package.json=${npmVersion}, jsr.json=${jsrVersion}`,
          );

          if (!checkOnly) {
            jsrJson.version = npmVersion;
            await Bun.write(jsrJsonPath, `${JSON.stringify(jsrJson, null, 2)}\n`);
            console.log(`\u2713 Updated ${dirName}/jsr.json to v${npmVersion}`);
            synced.push(packageJson.name);
          }
        } else {
          console.log(`\u2713 ${packageJson.name}@${npmVersion} is in sync`);
        }
      } catch (error) {
        if ((error as ErrnoException).code !== "ENOENT") {
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
    console.log("\n\u2713 All versions are in sync!");
  }

  return { success, mismatches, synced };
}

// CLI entry point
if (import.meta.main) {
  (async () => {
    const checkOnly = Bun.argv.includes("--check");
    const result = await syncVersions({ checkOnly });
    process.exit(result.success ? 0 : 1);
  })();
}
