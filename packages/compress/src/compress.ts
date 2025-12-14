/**
 * XZ and LZMA decompression implementation using Zig's std.compress via WebAssembly.
 *
 * This module contains the core implementation for XZ and LZMA decompression.
 * It provides both async functions that auto-initialize the WASM module, and
 * sync functions that require explicit initialization via {@link init}.
 *
 * ## Initialization
 *
 * The WASM module must be loaded before decompression can occur:
 *
 * - **Async functions** ({@link decompressXz}, {@link decompressLzma}): Automatically
 *   call {@link init} internally, making them ready to use without setup.
 * - **Sync functions** ({@link decompressXzSync}, {@link decompressLzmaSync}): Require
 *   you to call {@link init} first. Throws {@link NotInitializedError} if not initialized.
 *
 * Initialization is idempotent and concurrency-safe - calling {@link init} multiple
 * times or concurrently is safe and will only load the WASM module once.
 *
 * @example Async API (recommended)
 * ```ts
 * import { decompressXz, decompressLzma } from "@zig-wasm/compress";
 *
 * // No initialization needed - async functions auto-initialize
 * const xzResult = await decompressXz(xzCompressedBytes);
 * const lzmaResult = await decompressLzma(lzmaCompressedBytes);
 * ```
 *
 * @example Sync API
 * ```ts
 * import { init, decompressXzSync, decompressLzmaSync } from "@zig-wasm/compress";
 *
 * // Must initialize before using sync functions
 * await init();
 *
 * // Now sync functions are available
 * const xzResult = decompressXzSync(xzCompressedBytes);
 * const lzmaResult = decompressLzmaSync(lzmaCompressedBytes);
 * ```
 *
 * @module compress
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
 * Initialize the compress WASM module.
 *
 * This function loads and instantiates the WebAssembly module. It is:
 * - **Idempotent**: Safe to call multiple times; subsequent calls are no-ops
 * - **Concurrency-safe**: Multiple concurrent calls will share the same initialization
 *
 * The async API ({@link decompressXz}, {@link decompressLzma}) calls this automatically,
 * so explicit initialization is only needed when using the sync API
 * ({@link decompressXzSync}, {@link decompressLzmaSync}).
 *
 * @param options - Optional configuration for WASM loading
 * @returns A promise that resolves when initialization is complete
 *
 * @example Default initialization (auto-detects environment)
 * ```ts
 * import { init, decompressXzSync } from "@zig-wasm/compress";
 *
 * await init();
 * const result = decompressXzSync(compressedData);
 * ```
 *
 * @example Custom WASM path (Node.js/Bun)
 * ```ts
 * import { init } from "@zig-wasm/compress";
 *
 * await init({ wasmPath: "./my-wasm/compress.wasm" });
 * ```
 *
 * @example Custom WASM URL (browser)
 * ```ts
 * import { init } from "@zig-wasm/compress";
 *
 * await init({ wasmUrl: "https://cdn.example.com/compress.wasm" });
 * ```
 *
 * @example Pre-loaded WASM bytes
 * ```ts
 * import { init } from "@zig-wasm/compress";
 *
 * const wasmBytes = await fetch("/compress.wasm").then(r => r.arrayBuffer());
 * await init({ wasmBytes: new Uint8Array(wasmBytes) });
 * ```
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
      const wasmPath = join(currentDir, "../wasm/compress.wasm");
      result = await loadWasm<CompressWasmExports>({ wasmPath });
    } else {
      const wasmUrl = new URL("../wasm/compress.wasm", import.meta.url);
      result = await loadWasm<CompressWasmExports>({ wasmUrl: wasmUrl.href });
    }

    wasmExports = result.exports;
    wasmMemory = new WasmMemory(result.exports);
  })();

  await initPromise;
}

/**
 * Check if the WASM module has been initialized.
 *
 * Use this to conditionally call sync functions without risking a
 * {@link NotInitializedError}.
 *
 * @returns `true` if {@link init} has completed successfully, `false` otherwise
 *
 * @example
 * ```ts
 * import { init, isInitialized, decompressXzSync } from "@zig-wasm/compress";
 *
 * if (!isInitialized()) {
 *   await init();
 * }
 * const result = decompressXzSync(data);
 * ```
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
 * Decompress XZ-compressed data.
 *
 * This async function automatically initializes the WASM module if needed,
 * making it ready to use without calling {@link init} first.
 *
 * XZ is a container format that uses LZMA2 compression. Files typically
 * have a `.xz` extension and start with the magic bytes `0xFD 0x37 0x7A 0x58 0x5A 0x00`.
 *
 * @param data - The XZ-compressed input data as a `Uint8Array`
 * @returns A promise resolving to the decompressed data as a `Uint8Array`
 * @throws {Error} If the input is not valid XZ data or decompression fails
 *
 * @example Basic usage
 * ```ts
 * import { decompressXz } from "@zig-wasm/compress";
 *
 * const compressed = new Uint8Array([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00, ...]);
 * const decompressed = await decompressXz(compressed);
 * const text = new TextDecoder().decode(decompressed);
 * ```
 *
 * @example Decompressing a file (Node.js)
 * ```ts
 * import { decompressXz } from "@zig-wasm/compress";
 * import { readFile, writeFile } from "node:fs/promises";
 *
 * const compressed = await readFile("archive.xz");
 * const decompressed = await decompressXz(compressed);
 * await writeFile("archive.txt", decompressed);
 * ```
 *
 * @example Error handling
 * ```ts
 * import { decompressXz } from "@zig-wasm/compress";
 *
 * try {
 *   const result = await decompressXz(maybeCorruptData);
 * } catch (error) {
 *   console.error("XZ decompression failed:", error.message);
 * }
 * ```
 */
export async function decompressXz(data: Uint8Array): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return decompressXzImpl(exports, memory, data);
}

/**
 * Decompress LZMA-compressed data.
 *
 * This async function automatically initializes the WASM module if needed,
 * making it ready to use without calling {@link init} first.
 *
 * LZMA (Lempel-Ziv-Markov chain Algorithm) provides high compression ratios.
 * Files typically have a `.lzma` extension. This function handles raw LZMA
 * streams (not the XZ container format - use {@link decompressXz} for that).
 *
 * @param data - The LZMA-compressed input data as a `Uint8Array`
 * @returns A promise resolving to the decompressed data as a `Uint8Array`
 * @throws {Error} If the input is not valid LZMA data or decompression fails
 *
 * @example Basic usage
 * ```ts
 * import { decompressLzma } from "@zig-wasm/compress";
 *
 * const compressed = new Uint8Array([0x5d, 0x00, 0x00, ...]);
 * const decompressed = await decompressLzma(compressed);
 * const text = new TextDecoder().decode(decompressed);
 * ```
 *
 * @example Decompressing a file (Node.js)
 * ```ts
 * import { decompressLzma } from "@zig-wasm/compress";
 * import { readFile, writeFile } from "node:fs/promises";
 *
 * const compressed = await readFile("archive.lzma");
 * const decompressed = await decompressLzma(compressed);
 * await writeFile("archive.txt", decompressed);
 * ```
 *
 * @example Error handling
 * ```ts
 * import { decompressLzma } from "@zig-wasm/compress";
 *
 * try {
 *   const result = await decompressLzma(maybeCorruptData);
 * } catch (error) {
 *   console.error("LZMA decompression failed:", error.message);
 * }
 * ```
 */
export async function decompressLzma(data: Uint8Array): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return decompressLzmaImpl(exports, memory, data);
}

// ============================================================================
// Sync API
// ============================================================================

/**
 * Decompress XZ-compressed data synchronously.
 *
 * This sync function requires the WASM module to be initialized via {@link init}
 * before use. For a version that auto-initializes, use {@link decompressXz}.
 *
 * Use the sync API when you need to decompress data in a synchronous code path
 * after initialization has already been performed (e.g., in a hot loop or
 * callback where async is not practical).
 *
 * @param data - The XZ-compressed input data as a `Uint8Array`
 * @returns The decompressed data as a `Uint8Array`
 * @throws {NotInitializedError} If {@link init} has not been called
 * @throws {Error} If the input is not valid XZ data or decompression fails
 *
 * @example
 * ```ts
 * import { init, decompressXzSync } from "@zig-wasm/compress";
 *
 * // Initialize once at startup
 * await init();
 *
 * // Then use sync API anywhere
 * function processXzData(compressed: Uint8Array): string {
 *   const decompressed = decompressXzSync(compressed);
 *   return new TextDecoder().decode(decompressed);
 * }
 * ```
 *
 * @example Batch processing
 * ```ts
 * import { init, decompressXzSync } from "@zig-wasm/compress";
 *
 * await init();
 *
 * const compressedChunks: Uint8Array[] = [...];
 * const decompressed = compressedChunks.map(chunk => decompressXzSync(chunk));
 * ```
 */
export function decompressXzSync(data: Uint8Array): Uint8Array {
  const { exports, memory } = getSyncState();
  return decompressXzImpl(exports, memory, data);
}

/**
 * Decompress LZMA-compressed data synchronously.
 *
 * This sync function requires the WASM module to be initialized via {@link init}
 * before use. For a version that auto-initializes, use {@link decompressLzma}.
 *
 * Use the sync API when you need to decompress data in a synchronous code path
 * after initialization has already been performed (e.g., in a hot loop or
 * callback where async is not practical).
 *
 * @param data - The LZMA-compressed input data as a `Uint8Array`
 * @returns The decompressed data as a `Uint8Array`
 * @throws {NotInitializedError} If {@link init} has not been called
 * @throws {Error} If the input is not valid LZMA data or decompression fails
 *
 * @example
 * ```ts
 * import { init, decompressLzmaSync } from "@zig-wasm/compress";
 *
 * // Initialize once at startup
 * await init();
 *
 * // Then use sync API anywhere
 * function processLzmaData(compressed: Uint8Array): string {
 *   const decompressed = decompressLzmaSync(compressed);
 *   return new TextDecoder().decode(decompressed);
 * }
 * ```
 *
 * @example Batch processing
 * ```ts
 * import { init, decompressLzmaSync } from "@zig-wasm/compress";
 *
 * await init();
 *
 * const compressedChunks: Uint8Array[] = [...];
 * const decompressed = compressedChunks.map(chunk => decompressLzmaSync(chunk));
 * ```
 */
export function decompressLzmaSync(data: Uint8Array): Uint8Array {
  const { exports, memory } = getSyncState();
  return decompressLzmaImpl(exports, memory, data);
}
