/**
 * Runtime environment detection
 */

import type { RuntimeEnvironment } from "./types.js";

/** Detect the current runtime environment */
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

/** Get cached environment (detects once) */
export function getEnvironment(): RuntimeEnvironment {
  if (!cachedEnv) {
    cachedEnv = detectEnvironment();
  }
  return cachedEnv;
}
