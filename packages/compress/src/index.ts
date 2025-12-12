/**
 * @zig-wasm/compress
 *
 * XZ and LZMA decompression powered by Zig's std.compress via WebAssembly
 */

// Decompression functions
export { decompressLzma, decompressXz } from "./compress.ts";
// Types
export type { CompressWasmExports } from "./types.ts";
