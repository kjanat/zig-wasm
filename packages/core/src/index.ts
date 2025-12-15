/**
 * Core utilities for Zig WASM packages.
 *
 * This module provides the foundational infrastructure for all `@zig-wasm` packages:
 *
 * - **WASM Loading**: Load WebAssembly modules from bytes, URLs, or file paths
 *   via {@link loadWasm} or the higher-level {@link createWasmModule} factory
 * - **Memory Management**: Safely allocate, copy, and free memory in WASM linear
 *   memory using {@link WasmMemory} and {@link AllocationScope}
 * - **Environment Detection**: Detect Node.js, Bun, Deno, and browser environments
 *   with {@link detectEnvironment} and {@link getEnvironment}
 * - **Error Handling**: Typed error hierarchy via {@link ZigWasmError} and subclasses
 * - **Utilities**: Byte/hex conversion, string encoding via utility functions
 *
 * @example Loading a WASM module from a file path (Node.js/Bun)
 * ```ts
 * import { loadWasm, WasmMemory } from "@zig-wasm/core";
 *
 * const { exports, memory } = await loadWasm({
 *   wasmPath: "./my-module.wasm"
 * });
 *
 * // Use memory manager for allocations
 * const mem = new WasmMemory(exports);
 * const slice = mem.allocateAndCopy(new Uint8Array([1, 2, 3]));
 *
 * // Call your WASM function
 * exports.processData(slice.ptr, slice.len);
 *
 * // Clean up
 * mem.deallocate(slice.ptr, slice.len);
 * ```
 *
 * @example Loading from a URL (browser/Deno)
 * ```ts
 * import { loadWasm, WasmMemory } from "@zig-wasm/core";
 *
 * const { exports } = await loadWasm({
 *   wasmUrl: "/wasm/my-module.wasm"
 * });
 * ```
 *
 * @example Using AllocationScope for automatic cleanup
 * ```ts
 * import { AllocationScope, WasmMemory } from "@zig-wasm/core";
 *
 * const result = AllocationScope.use(mem, (scope) => {
 *   const input = scope.allocAndCopy(data);
 *   const output = scope.alloc(outputLen);
 *   exports.transform(input.ptr, input.len, output);
 *   return mem.copyOut(output, outputLen);
 * }); // All allocations freed automatically
 * ```
 *
 * @example Creating a reusable module controller
 * ```ts
 * import { createWasmModule } from "@zig-wasm/core";
 *
 * interface MyExports extends ZigWasmExports {
 *   myFunction: (ptr: number, len: number) => number;
 * }
 *
 * const myModule = createWasmModule<MyExports>({
 *   name: "my-module",
 *   wasmFileName: "my-module.wasm"
 * });
 *
 * // Initialize once, use sync APIs everywhere
 * await myModule.init({ wasmPath: "./my-module.wasm" });
 * const exports = myModule.getExports();
 * ```
 *
 * @example Error handling
 * ```ts
 * import { loadWasm, WasmLoadError, ZigWasmError } from "@zig-wasm/core";
 *
 * try {
 *   await loadWasm({ wasmPath: "./missing.wasm" });
 * } catch (error) {
 *   if (error instanceof WasmLoadError) {
 *     console.error("Failed to load WASM:", error.message);
 *   } else if (error instanceof ZigWasmError) {
 *     console.error("WASM error:", error.message);
 *   }
 * }
 * ```
 *
 * @module
 */

// Errors
export { NotInitializedError, WasmLoadError, WasmMemoryError, ZigWasmError } from "./errors.ts";

// Environment detection
export { detectEnvironment, getEnvironment } from "./env.ts";

// Module loading
export { createModuleLoader, defaultFetchFn, loadWasm, resolveWasmPath } from "./loader.ts";

// WASM module factory (init/sync pattern)
export { createWasmModule, resolveWasmPathForNode, resolveWasmUrlForBrowser } from "./wasm-module.ts";
export type { InitOptions, WasmModule, WasmModuleConfig } from "./wasm-module.ts";

// Memory management
export { AllocationScope, WasmMemory } from "./memory.ts";

// Types
export type {
  FetchWasmFn,
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
export { bytesToString, compareBytes, concatBytes, fromHex, stringToBytes, toHex } from "./utils.ts";

// LEB128 encoding/decoding
export { decodeSleb128, decodeUleb128, encodeSleb128, encodeUleb128 } from "./leb128.ts";

// WASM binary format utilities
export {
  encodeFuncType,
  encodeLimits,
  encodeSection,
  encodeString,
  encodeVec,
  ExportKind,
  ImportKind,
  isValidWasmHeader,
  Op,
  parseWasmSections,
  Section,
  SECTION_NAMES,
  TypeConstructor,
  ValType,
  WASM_HEADER,
  WASM_MAGIC,
  WASM_VERSION,
} from "./wasm-binary.ts";
export type { ParsedSection } from "./wasm-binary.ts";
