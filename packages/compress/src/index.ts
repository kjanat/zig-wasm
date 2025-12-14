/**
 * XZ and LZMA decompression powered by Zig's std.compress via WebAssembly.
 *
 * This module provides high-performance decompression for XZ and LZMA formats
 * using Zig's standard library compiled to WebAssembly. It works in Node.js,
 * Bun, Deno, and browser environments.
 *
 * ## API Variants
 *
 * The module provides two API styles:
 *
 * - **Async API** ({@link decompressXz}, {@link decompressLzma}): Auto-initializes
 *   the WASM module on first call. Recommended for most use cases.
 * - **Sync API** ({@link decompressXzSync}, {@link decompressLzmaSync}): Requires
 *   calling {@link init} first. Useful for performance-critical synchronous code paths.
 *
 * ## Supported Formats
 *
 * - **XZ**: The XZ container format using LZMA2 compression (`.xz` files)
 * - **LZMA**: Raw LZMA compressed data (`.lzma` files)
 *
 * @example Basic async usage
 * ```ts
 * import { decompressXz, decompressLzma } from "@zig-wasm/compress";
 *
 * // Decompress XZ data (auto-initializes WASM module)
 * const xzData = new Uint8Array([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00, ...]); // XZ magic bytes
 * const decompressed = await decompressXz(xzData);
 * console.log(new TextDecoder().decode(decompressed));
 *
 * // Decompress LZMA data
 * const lzmaData = new Uint8Array([0x5d, 0x00, 0x00, ...]); // LZMA header
 * const result = await decompressLzma(lzmaData);
 * ```
 *
 * @example Sync API with explicit initialization
 * ```ts
 * import { init, decompressXzSync, decompressLzmaSync, isInitialized } from "@zig-wasm/compress";
 *
 * // Initialize the WASM module first (required for sync API)
 * await init();
 * console.log(isInitialized()); // true
 *
 * // Now sync functions work without await
 * const decompressedXz = decompressXzSync(xzCompressedData);
 * const decompressedLzma = decompressLzmaSync(lzmaCompressedData);
 * ```
 *
 * @example Custom WASM loading
 * ```ts
 * import { init } from "@zig-wasm/compress";
 *
 * // Load WASM from custom path (Node.js/Bun)
 * await init({ wasmPath: "/custom/path/compress.wasm" });
 *
 * // Or from URL (browser)
 * await init({ wasmUrl: "https://cdn.example.com/compress.wasm" });
 *
 * // Or from pre-loaded bytes
 * const wasmBytes = await fetch("/compress.wasm").then(r => r.arrayBuffer());
 * await init({ wasmBytes: new Uint8Array(wasmBytes) });
 * ```
 *
 * @example Error handling
 * ```ts
 * import { decompressXz, NotInitializedError } from "@zig-wasm/compress";
 *
 * try {
 *   const result = await decompressXz(possiblyCorruptData);
 * } catch (error) {
 *   if (error instanceof Error) {
 *     console.error("Decompression failed:", error.message);
 *   }
 * }
 * ```
 *
 * @module
 */

// Lifecycle
export { init, isInitialized } from "./compress.ts";

// Async API
export { decompressLzma, decompressXz } from "./compress.ts";

// Sync API
export { decompressLzmaSync, decompressXzSync } from "./compress.ts";

// Types
export type { CompressWasmExports } from "./types.ts";

// Re-export error for convenience
export { NotInitializedError } from "@zig-wasm/core";
export type { InitOptions } from "@zig-wasm/core";
