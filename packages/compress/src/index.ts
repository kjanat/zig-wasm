/**
 * @zig-wasm/compress
 *
 * XZ and LZMA decompression powered by Zig's std.compress via WebAssembly
 */

// Types
export type { CompressWasmExports } from "./types.js";

// Decompression functions
export { decompressLzma, decompressXz } from "./compress.js";
