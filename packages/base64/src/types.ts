/**
 * Type definitions for the Base64 WebAssembly module.
 *
 * This module contains the TypeScript interface that describes the exports
 * from the Zig-compiled WebAssembly binary. These types are used internally
 * by the {@link encode}, {@link decode}, and other encoding functions.
 *
 * @example
 * ```ts
 * import type { Base64WasmExports } from "@zig-wasm/base64";
 *
 * // The interface extends WasmMemoryExports for memory management
 * declare const exports: Base64WasmExports;
 *
 * // Low-level access (not typically needed - use high-level API instead)
 * const encodedLen = exports.base64_encode_len(inputLength);
 * ```
 *
 * @module types
 */

import type { WasmMemoryExports } from "@zig-wasm/core";

/**
 * WebAssembly exports interface for the Base64 module.
 *
 * Extends {@link WasmMemoryExports} to include memory allocation functions.
 * This interface describes all functions exported by the Zig WebAssembly binary.
 *
 * The module provides four Base64 encoding variants:
 * - **Standard**: RFC 4648 Base64 with padding (`=`)
 * - **No Padding**: Standard alphabet without padding characters
 * - **URL-safe**: Uses `-` and `_` instead of `+` and `/`, with padding
 * - **URL-safe No Padding**: URL-safe alphabet without padding
 *
 * Additionally, hexadecimal encoding/decoding is provided.
 *
 * @example
 * ```ts
 * import type { Base64WasmExports } from "@zig-wasm/base64";
 *
 * // Type-safe access to WASM exports
 * function useExports(exports: Base64WasmExports) {
 *   // Calculate required buffer size before encoding
 *   const inputLen = 12;
 *   const outputLen = exports.base64_encode_len(inputLen);
 *   console.log(`Need ${outputLen} bytes for output`);
 * }
 * ```
 */
export interface Base64WasmExports extends WasmMemoryExports {
  /** Index signature for additional exports */
  [key: string]: unknown;

  // ---------------------------------------------------------------------------
  // Standard Base64 (RFC 4648)
  // ---------------------------------------------------------------------------

  /**
   * Encode bytes to standard Base64.
   * @param srcPtr - Pointer to source data in WASM memory
   * @param srcLen - Length of source data in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @returns The number of bytes written to the destination
   */
  base64_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;

  /**
   * Calculate the encoded length for standard Base64.
   * @param srcLen - Length of source data in bytes
   * @returns The number of bytes required for the encoded output
   */
  base64_encode_len: (srcLen: number) => number;

  /**
   * Decode standard Base64 to bytes.
   * @param srcPtr - Pointer to Base64 string in WASM memory
   * @param srcLen - Length of Base64 string in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @param destLen - Size of destination buffer
   * @returns The number of bytes written to the destination
   */
  base64_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
    destLen: number,
  ) => number;

  /**
   * Calculate the decoded length for standard Base64.
   * @param srcLen - Length of Base64 string in bytes
   * @returns The maximum number of bytes for the decoded output
   */
  base64_decode_len: (srcLen: number) => number;

  // ---------------------------------------------------------------------------
  // Base64 without padding
  // ---------------------------------------------------------------------------

  /**
   * Encode bytes to Base64 without padding characters.
   * @param srcPtr - Pointer to source data in WASM memory
   * @param srcLen - Length of source data in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @returns The number of bytes written to the destination
   */
  base64_no_pad_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;

  /**
   * Calculate the encoded length for Base64 without padding.
   * @param srcLen - Length of source data in bytes
   * @returns The number of bytes required for the encoded output
   */
  base64_no_pad_encode_len: (srcLen: number) => number;

  /**
   * Decode Base64 without padding to bytes.
   * @param srcPtr - Pointer to Base64 string in WASM memory
   * @param srcLen - Length of Base64 string in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @param destLen - Size of destination buffer
   * @returns The number of bytes written to the destination
   */
  base64_no_pad_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
    destLen: number,
  ) => number;

  /**
   * Calculate the decoded length for Base64 without padding.
   * @param srcLen - Length of Base64 string in bytes
   * @returns The maximum number of bytes for the decoded output
   */
  base64_no_pad_decode_len: (srcLen: number) => number;

  // ---------------------------------------------------------------------------
  // URL-safe Base64
  // ---------------------------------------------------------------------------

  /**
   * Encode bytes to URL-safe Base64.
   * Uses `-` and `_` instead of `+` and `/`.
   * @param srcPtr - Pointer to source data in WASM memory
   * @param srcLen - Length of source data in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @returns The number of bytes written to the destination
   */
  base64_url_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;

  /**
   * Calculate the encoded length for URL-safe Base64.
   * @param srcLen - Length of source data in bytes
   * @returns The number of bytes required for the encoded output
   */
  base64_url_encode_len: (srcLen: number) => number;

  /**
   * Decode URL-safe Base64 to bytes.
   * @param srcPtr - Pointer to Base64 string in WASM memory
   * @param srcLen - Length of Base64 string in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @param destLen - Size of destination buffer
   * @returns The number of bytes written to the destination
   */
  base64_url_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
    destLen: number,
  ) => number;

  /**
   * Calculate the decoded length for URL-safe Base64.
   * @param srcLen - Length of Base64 string in bytes
   * @returns The maximum number of bytes for the decoded output
   */
  base64_url_decode_len: (srcLen: number) => number;

  // ---------------------------------------------------------------------------
  // URL-safe Base64 without padding
  // ---------------------------------------------------------------------------

  /**
   * Encode bytes to URL-safe Base64 without padding.
   * Uses `-` and `_` instead of `+` and `/`, omits trailing `=`.
   * @param srcPtr - Pointer to source data in WASM memory
   * @param srcLen - Length of source data in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @returns The number of bytes written to the destination
   */
  base64_url_no_pad_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;

  /**
   * Calculate the encoded length for URL-safe Base64 without padding.
   * @param srcLen - Length of source data in bytes
   * @returns The number of bytes required for the encoded output
   */
  base64_url_no_pad_encode_len: (srcLen: number) => number;

  /**
   * Decode URL-safe Base64 without padding to bytes.
   * @param srcPtr - Pointer to Base64 string in WASM memory
   * @param srcLen - Length of Base64 string in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @param destLen - Size of destination buffer
   * @returns The number of bytes written to the destination
   */
  base64_url_no_pad_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
    destLen: number,
  ) => number;

  /**
   * Calculate the decoded length for URL-safe Base64 without padding.
   * @param srcLen - Length of Base64 string in bytes
   * @returns The maximum number of bytes for the decoded output
   */
  base64_url_no_pad_decode_len: (srcLen: number) => number;

  // ---------------------------------------------------------------------------
  // Hexadecimal encoding
  // ---------------------------------------------------------------------------

  /**
   * Encode bytes to lowercase hexadecimal string.
   * @param srcPtr - Pointer to source data in WASM memory
   * @param srcLen - Length of source data in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @returns The number of bytes written to the destination
   */
  hex_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;

  /**
   * Calculate the encoded length for hexadecimal.
   * @param srcLen - Length of source data in bytes
   * @returns The number of bytes required (always `srcLen * 2`)
   */
  hex_encode_len: (srcLen: number) => number;

  /**
   * Decode hexadecimal string to bytes.
   * @param srcPtr - Pointer to hex string in WASM memory
   * @param srcLen - Length of hex string in bytes
   * @param destPtr - Pointer to destination buffer in WASM memory
   * @returns The number of bytes written to the destination
   */
  hex_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;

  /**
   * Calculate the decoded length for hexadecimal.
   * @param srcLen - Length of hex string in bytes
   * @returns The number of bytes for decoded output (always `srcLen / 2`)
   */
  hex_decode_len: (srcLen: number) => number;
}
