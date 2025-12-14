/**
 * Type definitions for the compress WASM module.
 *
 * This module defines the TypeScript interfaces for the WebAssembly exports
 * provided by the Zig compress implementation. These types are used internally
 * by the compress module and are exported for advanced use cases where direct
 * WASM interaction is needed.
 *
 * @example Accessing raw WASM exports (advanced)
 * ```ts
 * import type { CompressWasmExports } from "@zig-wasm/compress";
 *
 * // The CompressWasmExports interface describes the raw WASM function signatures
 * // Most users should use the high-level decompressXz/decompressLzma functions instead
 * ```
 *
 * @module types
 */

import type { WasmMemoryExports } from "@zig-wasm/core";

/**
 * WebAssembly exports interface for the compress module.
 *
 * Extends {@link WasmMemoryExports} with XZ and LZMA decompression functions.
 * These are the raw WASM function signatures - most users should use the
 * high-level {@link decompressXz}, {@link decompressLzma}, or their sync variants instead.
 *
 * The WASM functions operate on raw memory pointers. Memory management is handled
 * automatically by the high-level API using the allocator functions from
 * {@link WasmMemoryExports}.
 *
 * @example Type usage for custom WASM loading
 * ```ts
 * import type { CompressWasmExports } from "@zig-wasm/compress";
 *
 * // If implementing custom WASM loading, ensure exports match this interface
 * function validateExports(exports: CompressWasmExports): void {
 *   if (typeof exports.xz_decompress !== "function") {
 *     throw new Error("Invalid WASM: missing xz_decompress");
 *   }
 * }
 * ```
 */
export interface CompressWasmExports extends WasmMemoryExports {
  /** Index signature for additional exports */
  [key: string]: unknown;

  /**
   * Decompress XZ-compressed data at the WASM level.
   *
   * This is a low-level function that operates on raw memory pointers.
   * Use {@link decompressXz} or {@link decompressXzSync} for a high-level API.
   *
   * @param inputPtr - Pointer to the compressed input data in WASM memory
   * @param inputLen - Length of the compressed input data in bytes
   * @param outputLenPtr - Pointer to a u32 location where the output length will be written
   * @returns Pointer to the decompressed data in WASM memory, or `0` (null) on error.
   *          The caller is responsible for deallocating the returned memory.
   */
  xz_decompress: (
    inputPtr: number,
    inputLen: number,
    outputLenPtr: number,
  ) => number;

  /**
   * Decompress LZMA-compressed data at the WASM level.
   *
   * This is a low-level function that operates on raw memory pointers.
   * Use {@link decompressLzma} or {@link decompressLzmaSync} for a high-level API.
   *
   * @param inputPtr - Pointer to the compressed input data in WASM memory
   * @param inputLen - Length of the compressed input data in bytes
   * @param outputLenPtr - Pointer to a u32 location where the output length will be written
   * @returns Pointer to the decompressed data in WASM memory, or `0` (null) on error.
   *          The caller is responsible for deallocating the returned memory.
   */
  lzma_decompress: (
    inputPtr: number,
    inputLen: number,
    outputLenPtr: number,
  ) => number;
}
