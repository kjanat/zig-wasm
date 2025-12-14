/**
 * Error types for Zig WASM modules.
 *
 * This module provides a typed error hierarchy for handling WASM-related failures:
 *
 * - {@link ZigWasmError} - Base class for all errors (catch-all)
 *   - {@link NotInitializedError} - Sync API called before `init()`
 *   - {@link WasmLoadError} - Failed to load or instantiate WASM module
 *   - {@link WasmMemoryError} - Memory allocation or access failures
 *
 * All errors extend the base {@link ZigWasmError}, allowing you to catch
 * all WASM-related errors with a single `catch` block if desired.
 *
 * @example Catching specific error types
 * ```ts
 * import {
 *   loadWasm,
 *   NotInitializedError,
 *   WasmLoadError,
 *   WasmMemoryError,
 *   ZigWasmError
 * } from "@zig-wasm/core";
 *
 * try {
 *   await loadWasm({ wasmPath: "./missing.wasm" });
 * } catch (error) {
 *   if (error instanceof WasmLoadError) {
 *     console.error("Load failed:", error.message);
 *     console.error("Cause:", error.cause);
 *   } else if (error instanceof WasmMemoryError) {
 *     console.error("Memory error:", error.message);
 *   } else if (error instanceof NotInitializedError) {
 *     console.error("Module not initialized:", error.message);
 *   }
 * }
 * ```
 *
 * @example Catching all WASM errors
 * ```ts
 * import { ZigWasmError } from "@zig-wasm/core";
 *
 * try {
 *   // Any WASM operation
 * } catch (error) {
 *   if (error instanceof ZigWasmError) {
 *     console.error("WASM error:", error.name, error.message);
 *   }
 * }
 * ```
 *
 * @module errors
 */

/**
 * Base error class for all Zig WASM errors.
 *
 * Allows consumers to catch all WASM-related errors with a single type.
 * All other error classes in this module extend this base class.
 *
 * @example
 * ```ts
 * import { ZigWasmError } from "@zig-wasm/core";
 *
 * try {
 *   await someWasmOperation();
 * } catch (error) {
 *   if (error instanceof ZigWasmError) {
 *     // Handle any WASM-related error
 *     console.error(`[${error.name}] ${error.message}`);
 *   }
 * }
 * ```
 */
export class ZigWasmError extends Error {
  /**
   * Creates a new ZigWasmError.
   *
   * @param message - Human-readable error description
   * @param options - Standard Error options (e.g., `cause` for error chaining)
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ZigWasmError";
  }
}

/**
 * Thrown when attempting to use a sync API before calling `init()`.
 *
 * This error indicates that a WASM module's synchronous API was called
 * before the module was initialized. Either call `init()` first or use
 * the async API which handles initialization automatically.
 *
 * @example
 * ```ts
 * import { createWasmModule, NotInitializedError } from "@zig-wasm/core";
 *
 * const module = createWasmModule({ name: "test", wasmFileName: "test.wasm" });
 *
 * try {
 *   // This throws because init() wasn't called
 *   const exports = module.getExports();
 * } catch (error) {
 *   if (error instanceof NotInitializedError) {
 *     console.error(error.message);
 *     // "test WASM module not initialized. Call init() first or use the async API."
 *   }
 * }
 *
 * // Fix: Initialize first
 * await module.init({ wasmPath: "./test.wasm" });
 * const exports = module.getExports(); // Now safe
 * ```
 */
export class NotInitializedError extends ZigWasmError {
  /**
   * Creates a new NotInitializedError.
   *
   * @param moduleName - Name of the uninitialized module (for error message)
   */
  constructor(moduleName: string) {
    super(
      `${moduleName} WASM module not initialized. `
        + `Call init() first or use the async API.`,
    );
    this.name = "NotInitializedError";
  }
}

/**
 * Thrown when a WASM module fails to load or instantiate.
 *
 * Common causes include:
 * - File not found (invalid path or URL)
 * - Network error when fetching
 * - Invalid WASM binary
 * - Missing required imports
 * - Module doesn't export required `memory`, `alloc`, or `free`
 *
 * The original error is available via the `cause` property for debugging.
 *
 * @example
 * ```ts
 * import { loadWasm, WasmLoadError } from "@zig-wasm/core";
 *
 * try {
 *   await loadWasm({ wasmPath: "./nonexistent.wasm" });
 * } catch (error) {
 *   if (error instanceof WasmLoadError) {
 *     console.error("Failed to load:", error.message);
 *     if (error.cause) {
 *       console.error("Original error:", error.cause);
 *     }
 *   }
 * }
 * ```
 */
export class WasmLoadError extends ZigWasmError {
  /**
   * Creates a new WasmLoadError.
   *
   * @param moduleName - Name of the module that failed to load
   * @param cause - The underlying error that caused the load failure
   */
  constructor(moduleName: string, cause?: unknown) {
    const msg = cause instanceof Error
      ? `Failed to load ${moduleName} WASM module: ${cause.message}`
      : `Failed to load ${moduleName} WASM module`;
    super(msg, { cause });
    this.name = "WasmLoadError";
  }
}

/**
 * Thrown when memory allocation or access fails in WASM linear memory.
 *
 * Common causes include:
 * - Allocation size is zero or negative
 * - WASM allocator returned null (out of memory)
 * - Attempting to access memory outside valid bounds
 *
 * @example
 * ```ts
 * import { WasmMemory, WasmMemoryError } from "@zig-wasm/core";
 *
 * try {
 *   const mem = new WasmMemory(exports);
 *   mem.allocate(0); // Throws: size must be positive
 * } catch (error) {
 *   if (error instanceof WasmMemoryError) {
 *     console.error("Memory error:", error.message);
 *   }
 * }
 * ```
 */
export class WasmMemoryError extends ZigWasmError {
  /**
   * Creates a new WasmMemoryError.
   *
   * @param message - Description of the memory error
   */
  constructor(message: string) {
    super(message);
    this.name = "WasmMemoryError";
  }
}
