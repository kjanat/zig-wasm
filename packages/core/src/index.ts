/**
 * @zig-wasm/core
 *
 * Core utilities for Zig WASM packages
 */

// Environment detection
export { detectEnvironment, getEnvironment } from "./env.ts";

// Module loading
export { createModuleLoader, loadWasm, resolveWasmPath } from "./loader.ts";

// WASM module factory (init/sync pattern)
export {
  createWasmModule,
  NotInitializedError,
  resolveWasmPathForNode,
  resolveWasmUrlForBrowser,
} from "./wasm-module.ts";
export type { InitOptions, WasmModule, WasmModuleConfig } from "./wasm-module.ts";

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

// Utilities
export { compareBytes, concatBytes, fromHex, toHex } from "./utils.ts";
