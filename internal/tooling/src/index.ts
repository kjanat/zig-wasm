/**
 * @name "@zig-wasm/tooling"
 * @description Shared configs and CLI tools for zig-wasm development
 *
 * Config exports:
 *   - @zig-wasm/tooling/biome - Biome linter config
 *   - @zig-wasm/tooling/tsconfig - TypeScript config
 *
 * CLI tools:
 *   - check-published: Check if a package version is published on npm
 *   - sync-versions: Sync versions between package.json and jsr.json
 */

import pkg from "../package.json" with { type: "json" };

export const VERSION = pkg.version;

export { checkPublished } from "./check-published.ts";
export type { CheckPublishedResult } from "./check-published.ts";

export { syncVersions } from "./sync-versions.ts";
export type { SyncVersionsOptions, SyncVersionsResult } from "./sync-versions.ts";
