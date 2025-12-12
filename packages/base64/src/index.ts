/**
 * @zig-wasm/base64
 *
 * Base64 and hex encoding/decoding powered by Zig via WebAssembly
 */

// Lifecycle
export { init, isInitialized } from "./base64.ts";

// Async API
export {
  decode,
  decodeNoPadding,
  decodeUrl,
  decodeUrlNoPadding,
  encode,
  encodeNoPadding,
  encodeUrl,
  encodeUrlNoPadding,
  hexDecode,
  hexEncode,
} from "./base64.ts";

// Sync API
export {
  decodeNoPaddingSync,
  decodeSync,
  decodeUrlNoPaddingSync,
  decodeUrlSync,
  encodeNoPaddingSync,
  encodeSync,
  encodeUrlNoPaddingSync,
  encodeUrlSync,
  hexDecodeSync,
  hexEncodeSync,
} from "./base64.ts";

// Types
export type { Base64WasmExports } from "./types.ts";

// Re-export error for convenience
export { NotInitializedError } from "@zig-wasm/core";
export type { InitOptions } from "@zig-wasm/core";
