/**
 * Runtime environment detection utilities.
 *
 * Provides functions to detect the current JavaScript runtime environment,
 * including Node.js, Bun, Deno, and browsers. This is used internally by
 * the WASM loader to choose the appropriate loading strategy (file path
 * vs URL, streaming vs buffered instantiation).
 *
 * The detection result is cached after first call to {@link getEnvironment}
 * for performance.
 *
 * @example Detecting the current environment
 * ```ts
 * import { detectEnvironment, getEnvironment } from "@zig-wasm/core";
 *
 * // Fresh detection (not cached)
 * const env = detectEnvironment();
 * console.log("Node.js:", env.isNode);
 * console.log("Bun:", env.isBun);
 * console.log("Deno:", env.isDeno);
 * console.log("Browser:", env.isBrowser);
 * console.log("Supports streaming:", env.supportsStreaming);
 * ```
 *
 * @example Using cached environment detection
 * ```ts
 * import { getEnvironment } from "@zig-wasm/core";
 *
 * const env = getEnvironment(); // Cached after first call
 *
 * if (env.isNode || env.isBun) {
 *   // Use file path for WASM loading
 *   const wasmPath = "./my-module.wasm";
 * } else if (env.isBrowser || env.isDeno) {
 *   // Use URL for WASM loading
 *   const wasmUrl = "/wasm/my-module.wasm";
 * }
 * ```
 *
 * @example Conditional streaming instantiation
 * ```ts
 * import { getEnvironment } from "@zig-wasm/core";
 *
 * const env = getEnvironment();
 * if (env.supportsStreaming) {
 *   // Can use WebAssembly.instantiateStreaming for better performance
 * } else {
 *   // Fall back to ArrayBuffer instantiation
 * }
 * ```
 *
 * @module env
 */

import type { RuntimeEnvironment } from "./types.ts";

/**
 * Detect the current runtime environment.
 *
 * Performs fresh detection each time it's called. For cached detection,
 * use {@link getEnvironment} instead.
 *
 * Detection order matters: Bun also has `process.versions.node`, so we
 * check for Bun first. Similarly, some environments may have partial
 * globals, so we check multiple conditions.
 *
 * @returns A {@link RuntimeEnvironment} object with boolean flags for each environment
 *
 * @example
 * ```ts
 * import { detectEnvironment } from "@zig-wasm/core";
 *
 * const env = detectEnvironment();
 * if (env.isNode) {
 *   console.log("Running in Node.js");
 * } else if (env.isBun) {
 *   console.log("Running in Bun");
 * } else if (env.isDeno) {
 *   console.log("Running in Deno");
 * } else if (env.isBrowser) {
 *   console.log("Running in browser");
 * }
 * ```
 */
export function detectEnvironment(): RuntimeEnvironment {
  const isNode = typeof process !== "undefined"
    && process.versions != null
    && process.versions.node != null;

  const isBun = typeof process !== "undefined"
    && process.versions != null
    && process.versions.bun != null;

  const isDeno =
    // @ts-expect-error - Deno global
    typeof Deno !== "undefined" && typeof Deno.version !== "undefined";

  const isBrowser = typeof window !== "undefined"
    && typeof document !== "undefined"
    && !isNode
    && !isDeno
    && !isBun;

  const supportsStreaming = typeof WebAssembly.instantiateStreaming === "function"
    && (isBrowser || isDeno);

  return {
    isNode,
    isBrowser,
    isDeno,
    isBun,
    supportsStreaming,
  };
}

/** Cached environment detection result */
let cachedEnv: RuntimeEnvironment | null = null;

/**
 * Get the cached runtime environment detection result.
 *
 * Performs detection once on first call and caches the result for
 * subsequent calls. This is more efficient than calling {@link detectEnvironment}
 * repeatedly.
 *
 * @returns A {@link RuntimeEnvironment} object with boolean flags for each environment
 *
 * @example
 * ```ts
 * import { getEnvironment } from "@zig-wasm/core";
 *
 * // First call performs detection
 * const env1 = getEnvironment();
 *
 * // Subsequent calls return cached result
 * const env2 = getEnvironment();
 * console.log(env1 === env2); // true
 * ```
 */
export function getEnvironment(): RuntimeEnvironment {
  if (!cachedEnv) {
    cachedEnv = detectEnvironment();
  }
  return cachedEnv;
}
