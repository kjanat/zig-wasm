/**
 * @zig-wasm/base64
 *
 * Base64 and hex encoding/decoding powered by Zig via WebAssembly
 */

export {
  // Standard Base64
  decode,
  // Base64 No Padding
  decodeNoPadding,
  // URL-safe Base64
  decodeUrl,
  // URL-safe Base64 No Padding
  decodeUrlNoPadding,
  encode,
  encodeNoPadding,
  encodeUrl,
  encodeUrlNoPadding,
  // Hex encoding
  hexDecode,
  hexEncode,
} from "./base64.js";
export type { Base64WasmExports } from "./types.js";
