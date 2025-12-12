/**
 * @zig-wasm/core
 *
 * Core utilities for Zig WASM packages
 */

// Types
export type {
  WasmMemoryExports,
  ZigWasmExports,
  WasmLoadOptions,
  WasmLoadResult,
  RuntimeEnvironment,
  WasmPtr,
  WasmSize,
  WasmSlice,
} from "./types.js";

// Environment detection
export { detectEnvironment, getEnvironment } from "./env.js";

// Memory management
export { WasmMemory, AllocationScope } from "./memory.js";

// Module loading
export { loadWasm, createModuleLoader, resolveWasmPath } from "./loader.js";

// Re-export utilities for convenience
export { toHex, fromHex, concatBytes, compareBytes } from "./utils.js";
