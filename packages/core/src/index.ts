/**
 * @zig-wasm/core
 *
 * Core utilities for Zig WASM packages
 */

// Environment detection
export { detectEnvironment, getEnvironment } from "./env.ts";
// Module loading
export { createModuleLoader, loadWasm, resolveWasmPath } from "./loader.ts";

// Memory management
export { AllocationScope, WasmMemory } from "./memory.ts";
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
} from "./types.ts";

// Re-export utilities for convenience
export { compareBytes, concatBytes, fromHex, toHex } from "./utils.ts";
