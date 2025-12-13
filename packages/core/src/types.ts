/**
 * Core types for Zig WASM modules
 */

/** Standard WASM memory exports from Zig modules */
export interface WasmMemoryExports {
  memory: WebAssembly.Memory;
  alloc: (size: number) => number;
  free: (ptr: number, size: number) => void;
}

/** Base interface for all Zig WASM module exports */
export interface ZigWasmExports extends WasmMemoryExports {
  [key: string]: unknown;
}

/** Function type for fetching WASM bytes */
export type FetchWasmFn = (url: string) => Promise<ArrayBuffer>;

/** Options for loading a WASM module */
export interface WasmLoadOptions {
  /** Pre-loaded WASM bytes (ArrayBuffer or Uint8Array) */
  wasmBytes?: ArrayBuffer | Uint8Array;
  /** URL to fetch WASM from (browser/Deno) */
  wasmUrl?: string | URL;
  /** Path to WASM file (Node.js) */
  wasmPath?: string;
  /** Custom imports to provide to the WASM module */
  imports?: WebAssembly.Imports;
  /** Custom fetch function for loading WASM (overrides default fetch) */
  fetchFn?: FetchWasmFn;
}

/** Result of loading a WASM module */
export interface WasmLoadResult<T extends ZigWasmExports = ZigWasmExports> {
  instance: WebAssembly.Instance;
  exports: T;
  memory: WebAssembly.Memory;
}

/** Environment detection result */
export interface RuntimeEnvironment {
  isNode: boolean;
  isBrowser: boolean;
  isDeno: boolean;
  isBun: boolean;
  supportsStreaming: boolean;
}

/** Pointer type for WASM linear memory */
export type WasmPtr = number;

/** Size type */
export type WasmSize = number;

/** Slice representation (ptr + len) */
export interface WasmSlice {
  ptr: WasmPtr;
  len: WasmSize;
}
