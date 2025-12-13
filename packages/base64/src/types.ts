import type { WasmMemoryExports } from "@zig-wasm/core";

/** Base64 WASM module exports */
export interface Base64WasmExports extends WasmMemoryExports {
  [key: string]: unknown;

  // Standard Base64
  base64_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;
  base64_encode_len: (srcLen: number) => number;
  base64_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
    destLen: number,
  ) => number;
  base64_decode_len: (srcLen: number) => number;

  // Base64 no padding
  base64_no_pad_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;
  base64_no_pad_encode_len: (srcLen: number) => number;
  base64_no_pad_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
    destLen: number,
  ) => number;
  base64_no_pad_decode_len: (srcLen: number) => number;

  // Base64 URL-safe
  base64_url_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;
  base64_url_encode_len: (srcLen: number) => number;
  base64_url_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
    destLen: number,
  ) => number;
  base64_url_decode_len: (srcLen: number) => number;

  // Base64 URL-safe no padding
  base64_url_no_pad_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;
  base64_url_no_pad_encode_len: (srcLen: number) => number;
  base64_url_no_pad_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
    destLen: number,
  ) => number;
  base64_url_no_pad_decode_len: (srcLen: number) => number;

  // Hex encoding
  hex_encode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;
  hex_encode_len: (srcLen: number) => number;
  hex_decode: (
    srcPtr: number,
    srcLen: number,
    destPtr: number,
  ) => number;
  hex_decode_len: (srcLen: number) => number;
}
