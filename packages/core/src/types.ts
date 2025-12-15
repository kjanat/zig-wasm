/**
 * Core type definitions for Zig WASM modules.
 *
 * This module provides TypeScript interfaces and types for working with
 * WebAssembly modules compiled from Zig. These types are used throughout
 * the `@zig-wasm` packages for type-safe WASM interaction.
 *
 * ## Key Types
 *
 * - {@link WasmMemoryExports}: Required exports for memory management
 * - {@link ZigWasmExports}: Base interface for typed module exports
 * - {@link WasmLoadOptions}: Configuration for {@link loadWasm}
 * - {@link WasmLoadResult}: Result of loading a WASM module
 * - {@link WasmPtr}, {@link WasmSize}, {@link WasmSlice}: Memory primitives
 *
 * @example Extending ZigWasmExports for your module
 * ```ts
 * import type { ZigWasmExports } from "@zig-wasm/core";
 *
 * interface MyModuleExports extends ZigWasmExports {
 *   // Your module's exported functions
 *   add: (a: number, b: number) => number;
 *   processData: (ptr: number, len: number) => number;
 * }
 * ```
 *
 * @example Using WasmSlice for memory operations
 * ```ts
 * import type { WasmSlice } from "@zig-wasm/core";
 *
 * function processWithSlice(mem: WasmMemory, data: Uint8Array): WasmSlice {
 *   const slice = mem.allocateAndCopy(data);
 *   exports.process(slice.ptr, slice.len);
 *   return slice;
 * }
 * ```
 *
 * @module types
 */

/**
 * Standard memory management exports required from Zig WASM modules.
 *
 * All Zig WASM modules must export these three items for memory management:
 * - `memory`: The WebAssembly linear memory instance
 * - `alloc`: Allocate bytes in linear memory
 * - `free`: Free previously allocated memory
 *
 * These are typically provided by Zig's standard library allocator when
 * built with the WASM target.
 */
export interface WasmMemoryExports {
  /** The WebAssembly linear memory instance */
  memory: WebAssembly.Memory;

  /**
   * Allocate memory in the WASM linear memory.
   *
   * @param size - Number of bytes to allocate
   * @returns Pointer to the allocated memory, or 0 on failure
   */
  alloc: (size: number) => number;

  /**
   * Free previously allocated memory.
   *
   * @param ptr - Pointer to the memory to free
   * @param size - Size of the allocation in bytes
   */
  free: (ptr: number, size: number) => void;
}

/**
 * Base interface for all Zig WASM module exports.
 *
 * Extend this interface to define type-safe exports for your WASM modules.
 * All exports include the required {@link WasmMemoryExports} plus any
 * additional functions your module provides.
 *
 * @example
 * ```ts
 * interface CryptoExports extends ZigWasmExports {
 *   sha256: (ptr: number, len: number, outPtr: number) => void;
 *   sha512: (ptr: number, len: number, outPtr: number) => void;
 * }
 *
 * const { exports } = await loadWasm<CryptoExports>({ wasmPath: "./crypto.wasm" });
 * exports.sha256(inputPtr, inputLen, outputPtr);
 * ```
 */
export interface ZigWasmExports extends WasmMemoryExports {
  /** Additional exports from the module */
  [key: string]: unknown;
}

/**
 * Function type for custom WASM byte fetching.
 *
 * Override the default fetch behavior by providing a custom function.
 * Useful for authenticated requests, custom caching, or loading from
 * non-standard sources.
 *
 * @example
 * ```ts
 * const customFetch: FetchWasmFn = async (url) => {
 *   const response = await fetch(url, {
 *     headers: { "Authorization": "Bearer token" }
 *   });
 *   return response.arrayBuffer();
 * };
 * ```
 */
export type FetchWasmFn = (url: string) => Promise<ArrayBuffer>;

/**
 * Options for loading a WASM module via {@link loadWasm}.
 *
 * Provide exactly one of:
 * - `wasmBytes`: Pre-loaded WASM binary
 * - `wasmUrl`: URL to fetch from (browser/Deno)
 * - `wasmPath`: File path to read from (Node.js/Bun)
 */
export interface WasmLoadOptions {
  /**
   * Pre-loaded WASM bytes.
   *
   * Use this when you've already fetched or embedded the WASM binary.
   */
  wasmBytes?: ArrayBuffer | Uint8Array;

  /**
   * URL to fetch WASM from.
   *
   * Best for browser and Deno environments. Streaming instantiation
   * is used automatically when available.
   */
  wasmUrl?: string | URL;

  /**
   * File path to WASM file.
   *
   * Only works in Node.js and Bun environments. The file is read
   * using `node:fs/promises`.
   */
  wasmPath?: string;

  /**
   * Custom WebAssembly imports.
   *
   * Merged with the default imports (Zig panic handler). Use this to
   * provide additional imports your WASM module requires.
   */
  imports?: WebAssembly.Imports;

  /**
   * Custom fetch function for loading WASM.
   *
   * Overrides the default `fetch` call. Useful for authenticated
   * requests or custom caching strategies.
   */
  fetchFn?: FetchWasmFn;
}

/**
 * Result of loading a WASM module via {@link loadWasm}.
 *
 * @typeParam T - The type of module exports (extends {@link ZigWasmExports})
 */
export interface WasmLoadResult<T extends ZigWasmExports = ZigWasmExports> {
  /** The instantiated WebAssembly instance */
  instance: WebAssembly.Instance;

  /** The typed module exports */
  exports: T;

  /** The WebAssembly linear memory */
  memory: WebAssembly.Memory;
}

/**
 * Runtime environment detection result.
 *
 * Returned by {@link detectEnvironment} and {@link getEnvironment}.
 */
export interface RuntimeEnvironment {
  /** True if running in Node.js */
  isNode: boolean;

  /** True if running in a browser */
  isBrowser: boolean;

  /** True if running in Deno */
  isDeno: boolean;

  /** True if running in Bun */
  isBun: boolean;

  /**
   * True if `WebAssembly.instantiateStreaming` is available and recommended.
   *
   * Streaming instantiation is more efficient as it compiles WASM while
   * downloading. Currently supported in browsers and Deno.
   */
  supportsStreaming: boolean;
}

/**
 * Pointer type for WASM linear memory.
 *
 * In WASM, pointers are 32-bit unsigned integers representing byte offsets
 * into linear memory. A pointer of 0 typically indicates null or failure.
 */
export type WasmPtr = number;

/**
 * Size type for memory allocations.
 *
 * Represents the size of an allocation or data region in bytes.
 */
export type WasmSize = number;

/**
 * Slice representation combining a pointer and length.
 *
 * This mirrors Zig's slice type, which is a pointer plus length pair.
 * Used for passing variable-length data between JavaScript and WASM.
 *
 * @example
 * ```ts
 * // Allocate and track a slice
 * const slice: WasmSlice = mem.allocateAndCopy(data);
 *
 * // Pass to WASM function
 * exports.process(slice.ptr, slice.len);
 *
 * // Clean up
 * mem.deallocate(slice.ptr, slice.len);
 * ```
 */
export interface WasmSlice {
  /** Pointer to the start of the data */
  ptr: WasmPtr;

  /** Length of the data in bytes */
  len: WasmSize;
}
