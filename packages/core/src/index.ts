/**
 * @zig-wasm/core
 *
 * Core utilities for Zig WASM packages
 */

// Types
export type {
  RuntimeEnvironment,
  WasmLoadOptions,
  WasmLoadResult,
  WasmMemoryExports,
  WasmPtr,
  WasmSize,
  WasmSlice,
  ZigWasmExports,
} from "./types.js";

// Environment detection
export { detectEnvironment, getEnvironment } from "./env.js";

// Memory management
export { AllocationScope, WasmMemory } from "./memory.js";

// Module loading
export { createModuleLoader, loadWasm, resolveWasmPath } from "./loader.js";

// Re-export utilities for convenience
export { compareBytes, concatBytes, fromHex, toHex } from "./utils.js";
