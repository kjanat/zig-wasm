#!/usr/bin/env bun
/**
 * Sync versions between package.json and jsr.json for all packages
 *
 * Usage:
 *   CLI: `bun sync-versions [--check]`
 *   Programmatic: `import { syncVersions } from "@zig-wasm/tooling"`
 */

import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

interface JsrJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

export interface SyncVersionsOptions {
  /** Only report differences without modifying files */
  checkOnly?: boolean;
  /** Base directory (defaults to process.cwd()) */
  cwd?: string;
}

export interface SyncVersionsResult {
  success: boolean;
  mismatches: number;
  synced: string[];
}

/**
 * Sync versions between package.json and jsr.json for all packages
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
        const dirName = dir.split("/").slice(-1)[0] ?? dir;

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
    console.log("\n\u2713 All versions are in sync!");
  }

  return { success, mismatches, synced };
}

// CLI entry point
if (import.meta.main) {
  const checkOnly = Bun.argv.includes("--check");
  const result = await syncVersions({ checkOnly });
  process.exit(result.success ? 0 : 1);
}
