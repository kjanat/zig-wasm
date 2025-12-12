/**
 * @zig-wasm/compress
 *
 * XZ and LZMA decompression powered by Zig's std.compress via WebAssembly
 */

// Decompression functions
export { decompressLzma, decompressXz } from "./compress.js";
// Types
export type { CompressWasmExports } from "./types.js";
