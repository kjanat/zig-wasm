/**
 * Internal tooling package for zig-wasm monorepo development.
 *
 * This package provides shared configurations and CLI tools used across
 * the zig-wasm monorepo for consistent linting, type-checking, and release management.
 *
 * ## Config Exports
 *
 * Extend these configs in your package:
 *
 * - `@zig-wasm/tooling/biome` - Biome linter configuration
 * - `@zig-wasm/tooling/tsconfig` - Strict TypeScript configuration
 *
 * ## CLI Tools
 *
 * - {@link checkPublished} - Check if a package version is published on npm
 * - {@link syncVersions} - Sync versions between package.json and jsr.json
 *
 * ## Types
 *
 * - {@link CheckPublishedResult} - Result from {@link checkPublished}
 * - {@link SyncVersionsOptions} - Options for {@link syncVersions}
 * - {@link SyncVersionsResult} - Result from {@link syncVersions}
 *
 * @example Check npm publishing status
 * ```ts
 * import { checkPublished } from "@zig-wasm/tooling";
 *
 * const result = await checkPublished("@zig-wasm/crypto");
 * if (result.published) {
 *   console.log(`${result.name}@${result.version} is already on npm`);
 * } else {
 *   console.log("Ready to publish!");
 * }
 * ```
 *
 * @example Sync package versions
 * ```ts
 * import { syncVersions } from "@zig-wasm/tooling";
 *
 * // Check for mismatches without modifying files
 * const result = await syncVersions({ checkOnly: true });
 * console.log(`Found ${result.mismatches} mismatches`);
 *
 * // Actually sync versions
 * await syncVersions();
 * ```
 *
 * @example CLI usage
 * ```bash
 * # Check if package is published
 * bun check-published @zig-wasm/crypto
 * bun check-published crypto
 *
 * # Sync versions (check only)
 * bun sync-versions --check
 *
 * # Sync versions (apply changes)
 * bun sync-versions
 * ```
 *
 * @module tooling
 */

import pkg from "../package.json" with { type: "json" };

export const VERSION = pkg.version;

export { checkPublished } from "./check-published.ts";
export type { CheckPublishedResult } from "./check-published.ts";

export { syncVersions } from "./sync-versions.ts";
export type { SyncVersionsOptions, SyncVersionsResult } from "./sync-versions.ts";
