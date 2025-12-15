import { existsSync } from "node:fs";
import { parse, resolve } from "node:path";

/**
 * Find the monorepo root by looking for pnpm-workspace.yaml.
 * @throws Error if the workspace file cannot be found while walking up to /
 */
export function findMonorepoRoot(startPath: string = process.cwd()): string {
  let current = startPath;

  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = resolve(current, "..");
    // Cross-platform root detection: at root, parent equals current
    if (parent === current || current === parse(current).root) {
      break;
    }
    current = parent;
  }

  throw new Error(
    "Could not find pnpm-workspace.yaml. Run this script from within the monorepo.",
  );
}
