import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Find the monorepo root by looking for pnpm-workspace.yaml.
 * @throws Error if the workspace file cannot be found while walking up to /
 */
export function findMonorepoRoot(startPath: string = process.cwd()): string {
  let current = startPath;

  while (current !== "/") {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    current = resolve(current, "..");
  }

  throw new Error(
    "Could not find pnpm-workspace.yaml. Run this script from within the monorepo.",
  );
}
