import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Resolve the absolute path to a package.json given a monorepo root and a
 * package identifier (scoped name, short name, or relative path).
 */
export function resolvePackageJsonPath(pkgPath: string, monorepoRoot: string): string {
  if (pkgPath.startsWith("@")) {
    const segments = pkgPath.split("/");
    const pkgDir = segments[segments.length - 1] || pkgPath;
    return resolve(monorepoRoot, "packages", pkgDir, "package.json");
  }

  if (pkgPath.startsWith(".")) {
    return resolve(monorepoRoot, pkgPath, "package.json");
  }

  return resolve(monorepoRoot, "packages", pkgPath, "package.json");
}

/**
 * Read and parse a package.json file.
 */
export async function readPackageJson(
  packageJsonPath: string,
): Promise<{ name: string; version: string; [key: string]: unknown }> {
  const content = await readFile(packageJsonPath, "utf-8");
  return JSON.parse(content) as { name: string; version: string; [key: string]: unknown };
}
