import type { WasmLoadResult } from "@zig-wasm/core";
import { getEnvironment, loadWasm, WasmMemory } from "@zig-wasm/core";

import type { CompressWasmExports } from "./types.ts";

// Lazy-loaded module
let wasmModule: Promise<WasmLoadResult<CompressWasmExports>> | null = null;
let memory: WasmMemory | null = null;

/** Get or load the WASM module */
async function getModule(): Promise<{
  exports: CompressWasmExports;
  memory: WasmMemory;
}> {
  if (!wasmModule) {
    const env = getEnvironment();

    if (env.isNode || env.isBun) {
      // Node.js: load from file
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "compress.wasm");
      wasmModule = loadWasm<CompressWasmExports>({ wasmPath });
    } else {
      // Browser: load from URL relative to module
      const wasmUrl = new URL("compress.wasm", import.meta.url);
      wasmModule = loadWasm<CompressWasmExports>({ wasmUrl: wasmUrl.href });
    }
  }

  const result = await wasmModule;
  if (!memory) {
    memory = new WasmMemory(result.exports);
  }
  return { exports: result.exports, memory };
}

/**
 * Decompress XZ-compressed data
 * @param data Compressed input data
 * @returns Decompressed data
 * @throws Error if decompression fails
 */
export async function decompressXz(data: Uint8Array): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();

  // Allocate and copy input data
  const inputSlice = mem.allocateAndCopy(data);

  // Allocate space for output length (u32 = 4 bytes)
  const outputLenPtr = mem.allocate(4);

  try {
    // Call decompress - returns pointer to output or 0 on error
    const outputPtr = exports.xz_decompress(
      inputSlice.ptr,
      inputSlice.len,
      outputLenPtr,
    );

    if (outputPtr === 0) {
      throw new Error("XZ decompression failed");
    }

    // Read output length
    const outputLen = mem.readU32(outputLenPtr);

    // Copy output data before freeing
    const result = mem.copyOut(outputPtr, outputLen);

    // Free the output allocation (allocated by WASM)
    mem.deallocate(outputPtr, outputLen);

    return result;
  } finally {
    // Always free input allocations
    mem.deallocate(inputSlice.ptr, inputSlice.len);
    mem.deallocate(outputLenPtr, 4);
  }
}

/**
 * Decompress LZMA-compressed data
 * @param data Compressed input data
 * @returns Decompressed data
 * @throws Error if decompression fails
 */
export async function decompressLzma(data: Uint8Array): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();

  // Allocate and copy input data
  const inputSlice = mem.allocateAndCopy(data);

  // Allocate space for output length (u32 = 4 bytes)
  const outputLenPtr = mem.allocate(4);

  try {
    // Call decompress - returns pointer to output or 0 on error
    const outputPtr = exports.lzma_decompress(
      inputSlice.ptr,
      inputSlice.len,
      outputLenPtr,
    );

    if (outputPtr === 0) {
      throw new Error("LZMA decompression failed");
    }

    // Read output length
    const outputLen = mem.readU32(outputLenPtr);

    // Copy output data before freeing
    const result = mem.copyOut(outputPtr, outputLen);

    // Free the output allocation (allocated by WASM)
    mem.deallocate(outputPtr, outputLen);

    return result;
  } finally {
    // Always free input allocations
    mem.deallocate(inputSlice.ptr, inputSlice.len);
    mem.deallocate(outputLenPtr, 4);
  }
}
