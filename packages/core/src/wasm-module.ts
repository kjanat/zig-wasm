/**
 * Factory for creating WASM module controllers with async + sync APIs.
 *
 * This module provides {@link createWasmModule}, a higher-level abstraction
 * over {@link loadWasm} that implements the "init/sync" pattern used by
 * all `@zig-wasm` packages. This pattern allows:
 *
 * - **Async API**: Functions that automatically initialize on first call
 * - **Sync API**: Functions that require explicit `init()` but have no async overhead
 *
 * The module controller handles:
 * - Lazy initialization (only loads WASM when needed)
 * - Idempotent initialization (safe to call `init()` multiple times)
 * - Concurrency safety (parallel `init()` calls share the same promise)
 * - Memory management via {@link WasmMemory}
 *
 * @example Creating a module controller
 * ```ts
 * import { createWasmModule, ZigWasmExports } from "@zig-wasm/core";
 *
 * interface MathExports extends ZigWasmExports {
 *   add: (a: number, b: number) => number;
 *   multiply: (a: number, b: number) => number;
 * }
 *
 * const mathModule = createWasmModule<MathExports>({
 *   name: "math",
 *   wasmFileName: "math.wasm"
 * });
 * ```
 *
 * @example Async API (auto-init)
 * ```ts
 * // No explicit init() needed - ensureInitialized handles it
 * const { exports, memory } = await mathModule.ensureInitialized({
 *   wasmPath: "./dist/math.wasm"
 * });
 *
 * console.log(exports.add(2, 3)); // 5
 * ```
 *
 * @example Sync API (explicit init)
 * ```ts
 * // Initialize explicitly first
 * await mathModule.init({ wasmPath: "./dist/math.wasm" });
 *
 * // Now sync access is safe
 * const exports = mathModule.getExports();
 * console.log(exports.add(2, 3)); // 5
 *
 * // Multiple init() calls are safe (idempotent)
 * await mathModule.init(); // No-op, already initialized
 * ```
 *
 * @example Error handling for uninitialized access
 * ```ts
 * import { createWasmModule, NotInitializedError } from "@zig-wasm/core";
 *
 * const module = createWasmModule({ name: "test", wasmFileName: "test.wasm" });
 *
 * try {
 *   module.getExports(); // Throws - not initialized
 * } catch (error) {
 *   if (error instanceof NotInitializedError) {
 *     console.error("Call init() first!");
 *   }
 * }
 * ```
 *
 * @module wasm-module
 */

import { getEnvironment } from "./env.ts";
import { NotInitializedError } from "./errors.ts";
import { loadWasm } from "./loader.ts";
import { WasmMemory } from "./memory.ts";
import type { FetchWasmFn, WasmLoadOptions, WasmLoadResult, ZigWasmExports } from "./types.ts";

// Re-export for backwards compatibility
export { NotInitializedError } from "./errors.ts";

/**
 * Options for initializing a WASM module via {@link WasmModule.init}.
 *
 * Provide at least one of `wasmUrl`, `wasmPath`, or `wasmBytes` to specify
 * where to load the WASM binary from. If none are provided, the module
 * will attempt to load from a default location based on the environment.
 */
export interface InitOptions {
  /**
   * URL to load WASM from (browser/Deno).
   *
   * @example
   * ```ts
   * await module.init({ wasmUrl: "/wasm/my-module.wasm" });
   * ```
   */
  wasmUrl?: string;

  /**
   * File path to load WASM from (Node.js/Bun).
   *
   * @example
   * ```ts
   * await module.init({ wasmPath: "./dist/my-module.wasm" });
   * ```
   */
  wasmPath?: string;

  /**
   * Pre-loaded WASM bytes.
   *
   * @example
   * ```ts
   * const bytes = await fs.readFile("./module.wasm");
   * await module.init({ wasmBytes: bytes });
   * ```
   */
  wasmBytes?: ArrayBuffer | Uint8Array;

  /**
   * Custom WebAssembly imports.
   *
   * Merged with the default Zig panic handler.
   */
  imports?: WebAssembly.Imports;

  /**
   * Custom fetch function for loading WASM.
   *
   * Overrides the default `fetch` behavior.
   */
  fetchFn?: FetchWasmFn;
}

/**
 * Interface for a WASM module controller.
 *
 * Provides both async and sync access patterns to a WASM module.
 * Created by {@link createWasmModule}.
 *
 * @typeParam TExports - The typed exports interface for the module
 */
export interface WasmModule<TExports extends ZigWasmExports> {
  /**
   * Initialize the module.
   *
   * Idempotent and concurrency-safe: multiple calls are no-ops if already
   * initialized, and parallel calls share the same initialization promise.
   *
   * @param options - Optional loading configuration
   */
  init(options?: InitOptions): Promise<void>;

  /**
   * Check if the module is initialized.
   *
   * @returns True if `init()` has completed successfully
   */
  isInitialized(): boolean;

  /**
   * Get the module exports synchronously.
   *
   * @returns The typed module exports
   * @throws {@link NotInitializedError} if `init()` hasn't been called
   */
  getExports(): TExports;

  /**
   * Get the memory manager synchronously.
   *
   * @returns The {@link WasmMemory} instance for this module
   * @throws {@link NotInitializedError} if `init()` hasn't been called
   */
  getMemory(): WasmMemory;

  /**
   * Ensure the module is initialized and return exports + memory.
   *
   * Convenience method for async code that combines `init()` with
   * `getExports()` and `getMemory()`.
   *
   * @param options - Optional loading configuration
   * @returns Object containing typed exports and memory manager
   */
  ensureInitialized(options?: InitOptions): Promise<{ exports: TExports; memory: WasmMemory }>;
}

/**
 * Configuration for creating a WASM module via {@link createWasmModule}.
 */
export interface WasmModuleConfig {
  /**
   * Module name for error messages.
   *
   * Used in {@link NotInitializedError} messages to identify which module
   * wasn't initialized.
   */
  name: string;

  /**
   * WASM filename (e.g., "crypto.wasm").
   *
   * Used as the default filename when no explicit path/URL is provided
   * to `init()`.
   */
  wasmFileName: string;
}

/**
 * Create a WASM module controller with the init/sync pattern.
 *
 * This factory creates a controller object that manages WASM module
 * initialization and provides both async and sync access patterns.
 *
 * The controller is:
 * - **Lazy**: WASM is only loaded when `init()` or `ensureInitialized()` is called
 * - **Idempotent**: Multiple `init()` calls are safe and efficient
 * - **Concurrency-safe**: Parallel `init()` calls share the same promise
 *
 * @typeParam TExports - The typed exports interface for the module
 * @param config - Module configuration
 * @returns A {@link WasmModule} controller
 *
 * @example Basic usage
 * ```ts
 * import { createWasmModule, ZigWasmExports } from "@zig-wasm/core";
 *
 * interface CryptoExports extends ZigWasmExports {
 *   sha256: (ptr: number, len: number, outPtr: number) => void;
 * }
 *
 * const cryptoModule = createWasmModule<CryptoExports>({
 *   name: "crypto",
 *   wasmFileName: "crypto.wasm",
 * });
 *
 * // Initialize with path
 * await cryptoModule.init({ wasmPath: "./crypto.wasm" });
 *
 * // Use synchronously
 * const exports = cryptoModule.getExports();
 * const memory = cryptoModule.getMemory();
 * ```
 *
 * @example Async API with ensureInitialized
 * ```ts
 * // Combines init() + getExports() + getMemory()
 * const { exports, memory } = await cryptoModule.ensureInitialized({
 *   wasmPath: "./crypto.wasm"
 * });
 * ```
 *
 * @example Checking initialization state
 * ```ts
 * if (cryptoModule.isInitialized()) {
 *   // Safe to call sync APIs
 *   const exports = cryptoModule.getExports();
 * } else {
 *   // Need to initialize first
 *   await cryptoModule.init({ wasmPath: "./crypto.wasm" });
 * }
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
 * Build load options from InitOptions and default paths.
 * @internal
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
 * Resolve a WASM file path for Node.js/Bun environments.
 *
 * Converts `import.meta.url` to a directory path and joins it with
 * the WASM filename. Useful for packages that bundle their WASM file
 * alongside the JavaScript code.
 *
 * @param importMetaUrl - The `import.meta.url` of the calling module
 * @param wasmFileName - The WASM filename to resolve
 * @returns A Promise resolving to the absolute file path
 *
 * @example
 * ```ts
 * import { resolveWasmPathForNode } from "@zig-wasm/core";
 *
 * // In your package's init code:
 * const wasmPath = await resolveWasmPathForNode(import.meta.url, "my-module.wasm");
 * // Returns: "/path/to/package/dist/my-module.wasm"
 *
 * await module.init({ wasmPath });
 * ```
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
 * Resolve a WASM file URL for browser environments.
 *
 * Creates a URL relative to `import.meta.url`. Useful for packages
 * that serve their WASM file from the same location as the JavaScript.
 *
 * @param importMetaUrl - The `import.meta.url` of the calling module
 * @param wasmFileName - The WASM filename to resolve
 * @returns The resolved URL as a string
 *
 * @example
 * ```ts
 * import { resolveWasmUrlForBrowser } from "@zig-wasm/core";
 *
 * // In your package's init code:
 * const wasmUrl = resolveWasmUrlForBrowser(import.meta.url, "my-module.wasm");
 * // Returns: "https://example.com/path/to/my-module.wasm"
 *
 * await module.init({ wasmUrl });
 * ```
 */
export function resolveWasmUrlForBrowser(
  importMetaUrl: string,
  wasmFileName: string,
): string {
  return new URL(wasmFileName, importMetaUrl).href;
}
