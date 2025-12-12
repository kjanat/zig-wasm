/**
 * Compress module - XZ and LZMA decompression
 *
 * Provides both async (lazy-loading) and sync (requires init) APIs.
 */

import type { InitOptions } from "@zig-wasm/core";
import { getEnvironment, loadWasm, NotInitializedError, WasmMemory } from "@zig-wasm/core";
import type { CompressWasmExports } from "./types.ts";

// ============================================================================
// Module initialization
// ============================================================================

let wasmExports: CompressWasmExports | null = null;
let wasmMemory: WasmMemory | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the compress module (idempotent, concurrency-safe)
 */
export async function init(options?: InitOptions): Promise<void> {
  if (wasmExports) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    const env = getEnvironment();
    let result: Awaited<ReturnType<typeof loadWasm<CompressWasmExports>>>;

    if (options?.wasmBytes) {
      result = await loadWasm<CompressWasmExports>({ wasmBytes: options.wasmBytes, imports: options.imports });
    } else if (options?.wasmPath) {
      result = await loadWasm<CompressWasmExports>({ wasmPath: options.wasmPath, imports: options.imports });
    } else if (options?.wasmUrl) {
      result = await loadWasm<CompressWasmExports>({ wasmUrl: options.wasmUrl, imports: options.imports });
    } else if (env.isNode || env.isBun) {
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "compress.wasm");
      result = await loadWasm<CompressWasmExports>({ wasmPath });
    } else {
      const wasmUrl = new URL("compress.wasm", import.meta.url);
      result = await loadWasm<CompressWasmExports>({ wasmUrl: wasmUrl.href });
    }

    wasmExports = result.exports;
    wasmMemory = new WasmMemory(result.exports);
  })();

  await initPromise;
}

/**
 * Check if the module is initialized
 */
export function isInitialized(): boolean {
  return wasmExports !== null;
}

async function ensureInit(): Promise<{ exports: CompressWasmExports; memory: WasmMemory }> {
  await init();
  return { exports: wasmExports as CompressWasmExports, memory: wasmMemory as WasmMemory };
}

function getSyncState(): { exports: CompressWasmExports; memory: WasmMemory } {
  if (!wasmExports || !wasmMemory) {
    throw new NotInitializedError("compress");
  }
  return { exports: wasmExports, memory: wasmMemory };
}

// ============================================================================
// Internal implementations
// ============================================================================

function decompressXzImpl(exports: CompressWasmExports, mem: WasmMemory, data: Uint8Array): Uint8Array {
  const inputSlice = mem.allocateAndCopy(data);
  const outputLenPtr = mem.allocate(4);

  try {
    const outputPtr = exports.xz_decompress(inputSlice.ptr, inputSlice.len, outputLenPtr);

    if (outputPtr === 0) {
      throw new Error("XZ decompression failed");
    }

    const outputLen = mem.readU32(outputLenPtr);
    const result = mem.copyOut(outputPtr, outputLen);
    mem.deallocate(outputPtr, outputLen);

    return result;
  } finally {
    mem.deallocate(inputSlice.ptr, inputSlice.len);
    mem.deallocate(outputLenPtr, 4);
  }
}

function decompressLzmaImpl(exports: CompressWasmExports, mem: WasmMemory, data: Uint8Array): Uint8Array {
  const inputSlice = mem.allocateAndCopy(data);
  const outputLenPtr = mem.allocate(4);

  try {
    const outputPtr = exports.lzma_decompress(inputSlice.ptr, inputSlice.len, outputLenPtr);

    if (outputPtr === 0) {
      throw new Error("LZMA decompression failed");
    }

    const outputLen = mem.readU32(outputLenPtr);
    const result = mem.copyOut(outputPtr, outputLen);
    mem.deallocate(outputPtr, outputLen);

    return result;
  } finally {
    mem.deallocate(inputSlice.ptr, inputSlice.len);
    mem.deallocate(outputLenPtr, 4);
  }
}

// ============================================================================
// Async API
// ============================================================================

/**
 * Decompress XZ-compressed data
 * @param data Compressed input data
 * @returns Decompressed data
 * @throws Error if decompression fails
 */
export async function decompressXz(data: Uint8Array): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return decompressXzImpl(exports, memory, data);
}

/**
 * Decompress LZMA-compressed data
 * @param data Compressed input data
 * @returns Decompressed data
 * @throws Error if decompression fails
 */
export async function decompressLzma(data: Uint8Array): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return decompressLzmaImpl(exports, memory, data);
}

// ============================================================================
// Sync API
// ============================================================================

/**
 * Decompress XZ-compressed data (sync)
 * @param data Compressed input data
 * @returns Decompressed data
 * @throws Error if decompression fails
 */
export function decompressXzSync(data: Uint8Array): Uint8Array {
  const { exports, memory } = getSyncState();
  return decompressXzImpl(exports, memory, data);
}

/**
 * Decompress LZMA-compressed data (sync)
 * @param data Compressed input data
 * @returns Decompressed data
 * @throws Error if decompression fails
 */
export function decompressLzmaSync(data: Uint8Array): Uint8Array {
  const { exports, memory } = getSyncState();
  return decompressLzmaImpl(exports, memory, data);
}
