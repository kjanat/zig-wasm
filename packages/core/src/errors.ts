/**
 * Error types for Zig WASM modules
 *
 * Hierarchy:
 *   ZigWasmError (base)
 *   ├── NotInitializedError - sync API called before init()
 *   ├── WasmLoadError - failed to load/instantiate WASM
 *   └── WasmMemoryError - memory allocation/access failures
 */

/**
 * Base error for all Zig WASM errors
 * Allows consumers to catch all WASM-related errors with a single type
 */
export class ZigWasmError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ZigWasmError";
  }
}

/**
 * Thrown when attempting to use sync API before calling init()
 */
export class NotInitializedError extends ZigWasmError {
  constructor(moduleName: string) {
    super(
      `${moduleName} WASM module not initialized. `
        + `Call init() first or use the async API.`,
    );
    this.name = "NotInitializedError";
  }
}

/**
 * Thrown when WASM module fails to load or instantiate
 */
export class WasmLoadError extends ZigWasmError {
  constructor(moduleName: string, cause?: unknown) {
    const msg = cause instanceof Error
      ? `Failed to load ${moduleName} WASM module: ${cause.message}`
      : `Failed to load ${moduleName} WASM module`;
    super(msg, { cause });
    this.name = "WasmLoadError";
  }
}

/**
 * Thrown when memory allocation or access fails
 */
export class WasmMemoryError extends ZigWasmError {
  constructor(message: string) {
    super(message);
    this.name = "WasmMemoryError";
  }
}
