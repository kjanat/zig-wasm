/**
 * LZMA and XZ decompression via Zig WebAssembly.
 *
 * This module provides high-performance decompression for LZMA (.lzma) and XZ (.xz) formats.
 * Useful for decompressing archives, embedded compressed data, or streaming compressed content.
 *
 * This is a subpath re-export of {@link https://jsr.io/@zig-wasm/compress | @zig-wasm/compress}.
 * For the smallest bundle size, import directly from `@zig-wasm/compress`.
 *
 * @example Decompress XZ data
 * ```ts
 * import { decompressXz } from "@zig-wasm/std/compress";
 *
 * // Decompress XZ-compressed data
 * const compressed = new Uint8Array([/* XZ data *\/]);
 * const decompressed = await decompressXz(compressed);
 * console.log(new TextDecoder().decode(decompressed));
 * ```
 *
 * @example Decompress LZMA data
 * ```ts
 * import { decompressLzma } from "@zig-wasm/std/compress";
 *
 * // Decompress LZMA-compressed data
 * const compressed = new Uint8Array([/* LZMA data *\/]);
 * const decompressed = await decompressLzma(compressed);
 * ```
 *
 * @example Synchronous API (requires init() first)
 * ```ts
 * import { init, decompressXzSync, decompressLzmaSync } from "@zig-wasm/std/compress";
 *
 * await init();
 * const result = decompressXzSync(compressedData);
 * ```
 *
 * @module compress
 */
export * from "@zig-wasm/compress";
