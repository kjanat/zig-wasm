/**
 * Factory for creating WASM module controllers with async + sync APIs
 */

import { getEnvironment } from "./env.ts";
import { NotInitializedError } from "./errors.ts";
import { loadWasm } from "./loader.ts";
import { WasmMemory } from "./memory.ts";
import type { FetchWasmFn, WasmLoadOptions, WasmLoadResult, ZigWasmExports } from "./types.ts";

// Re-export for backwards compatibility
export { NotInitializedError } from "./errors.ts";

/**
 * Options for initializing a WASM module
 */
export interface InitOptions {
  /** Custom URL to load WASM from (browser) */
  wasmUrl?: string;
  /** Custom path to load WASM from (Node.js/Bun) */
  wasmPath?: string;
  /** Pre-loaded WASM bytes */
  wasmBytes?: ArrayBuffer | Uint8Array;
  /** Custom imports to provide to the WASM module */
  imports?: WebAssembly.Imports;
  /** Custom fetch function for loading WASM (overrides default fetch) */
  fetchFn?: FetchWasmFn;
}

/**
 * Interface for a WASM module controller
 */
export interface WasmModule<TExports extends ZigWasmExports> {
  /** Initialize the module (idempotent, concurrency-safe) */
  init(options?: InitOptions): Promise<void>;
  /** Check if the module is initialized */
  isInitialized(): boolean;
  /** Get exports (throws NotInitializedError if not initialized) */
  getExports(): TExports;
  /** Get memory wrapper (throws NotInitializedError if not initialized) */
  getMemory(): WasmMemory;
  /** Internal: ensure initialized for async API */
  ensureInitialized(options?: InitOptions): Promise<{ exports: TExports; memory: WasmMemory }>;
}

/**
 * Configuration for creating a WASM module
 */
export interface WasmModuleConfig {
  /** Module name (for error messages) */
  name: string;
  /** WASM filename (e.g., "crypto.wasm") */
  wasmFileName: string;
}

/**
 * Create a WASM module controller with init/sync pattern
 *
 * @param config - Module configuration
 * @returns WasmModule controller
 *
 * @example
 * ```ts
 * const cryptoModule = createWasmModule<CryptoExports>({
 *   name: "crypto",
 *   wasmFileName: "crypto.wasm",
 * });
 *
 * // Async API (lazy init)
 * await cryptoModule.ensureInitialized();
 * const exports = cryptoModule.getExports();
 *
 * // Sync API (requires preload)
 * await cryptoModule.init();
 * const exports = cryptoModule.getExports(); // safe now
 * ```
 */
export function createWasmModule<TExports extends ZigWasmExports>(
  config: WasmModuleConfig,
): WasmModule<TExports> {
  let result: WasmLoadResult<TExports> | null = null;
  let memory: WasmMemory | null = null;
  let initPromise: Promise<void> | null = null;

  async function init(options?: InitOptions): Promise<void> {
    // Already initialized
    if (result) return;

    // Initialization in progress - wait for it
    if (initPromise) {
      await initPromise;
      return;
    }

    // Start initialization
    initPromise = (async () => {
      const loadOptions = buildLoadOptions(config.wasmFileName, options);
      result = await loadWasm<TExports>(loadOptions);
      memory = new WasmMemory(result.exports);
    })();

    await initPromise;
  }

  function isInitialized(): boolean {
    return result !== null;
  }

  function getExports(): TExports {
    if (!result) {
      throw new NotInitializedError(config.name);
    }
    return result.exports;
  }

  function getMemory(): WasmMemory {
    if (!memory) {
      throw new NotInitializedError(config.name);
    }
    return memory;
  }

  async function ensureInitialized(
    options?: InitOptions,
  ): Promise<{ exports: TExports; memory: WasmMemory }> {
    await init(options);
    return { exports: getExports(), memory: getMemory() };
  }

  return {
    init,
    isInitialized,
    getExports,
    getMemory,
    ensureInitialized,
  };
}

/**
 * Build load options from InitOptions and default paths
 */
function buildLoadOptions(wasmFileName: string, options?: InitOptions): WasmLoadOptions {
  const baseOpts = {
    imports: options?.imports,
    fetchFn: options?.fetchFn,
  };

  // If explicit options provided, use them
  if (options?.wasmBytes) {
    return { ...baseOpts, wasmBytes: options.wasmBytes };
  }
  if (options?.wasmUrl) {
    return { ...baseOpts, wasmUrl: options.wasmUrl };
  }
  if (options?.wasmPath) {
    return { ...baseOpts, wasmPath: options.wasmPath };
  }

  // Default: detect environment and build appropriate path
  const env = getEnvironment();

  if (env.isNode || env.isBun) {
    // Will be resolved by the package's loader
    // This is a placeholder - each package overrides this
    return { ...baseOpts, wasmPath: wasmFileName };
  }

  // Browser/Deno: use URL relative to module
  return { ...baseOpts, wasmUrl: wasmFileName };
}

/**
 * Helper to resolve WASM path for Node.js/Bun environments
 */
export async function resolveWasmPathForNode(
  importMetaUrl: string,
  wasmFileName: string,
): Promise<string> {
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const currentDir = dirname(fileURLToPath(importMetaUrl));
  return join(currentDir, wasmFileName);
}

/**
 * Helper to resolve WASM URL for browser environments
 */
export function resolveWasmUrlForBrowser(
  importMetaUrl: string,
  wasmFileName: string,
): string {
  return new URL(wasmFileName, importMetaUrl).href;
}
