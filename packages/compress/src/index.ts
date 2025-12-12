/**
 * @zig-wasm/compress
 *
 * XZ and LZMA decompression powered by Zig's std.compress via WebAssembly
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
