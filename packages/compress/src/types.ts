import type { WasmMemoryExports } from "@zig-wasm/core";

/** Compress WASM module exports */
export interface CompressWasmExports extends WasmMemoryExports {
  [key: string]: unknown;
  /**
   * Decompress XZ data
   * @param inputPtr Pointer to compressed input data
   * @param inputLen Length of compressed input
   * @param outputLenPtr Pointer to u32 where output length will be written
   * @returns Pointer to decompressed data, or 0 (null) on error
   */
  xz_decompress: (
    inputPtr: number,
    inputLen: number,
    outputLenPtr: number,
  ) => number;

  /**
   * Decompress LZMA data
   * @param inputPtr Pointer to compressed input data
   * @param inputLen Length of compressed input
   * @param outputLenPtr Pointer to u32 where output length will be written
   * @returns Pointer to decompressed data, or 0 (null) on error
   */
  lzma_decompress: (
    inputPtr: number,
    inputLen: number,
    outputLenPtr: number,
  ) => number;
}
