/**
 * High-performance Base64 and hexadecimal encoding/decoding powered by Zig WebAssembly.
 *
 * This package provides fast, reliable encoding operations with support for multiple
 * Base64 variants and hexadecimal encoding. The Zig-based WASM implementation offers
 * consistent performance across all JavaScript runtimes (Node.js, Bun, Deno, browsers).
 *
 * ## Features
 *
 * - **Standard Base64**: RFC 4648 compliant with padding
 * - **URL-safe Base64**: Uses `-` and `_` characters (safe for URLs/filenames)
 * - **No-padding variants**: Omits trailing `=` characters
 * - **Hexadecimal**: Lowercase hex encoding/decoding
 * - **Two API styles**: Async (auto-init) and Sync (manual init)
 *
 * ## Quick Start
 *
 * The async API is the easiest way to get started - it automatically initializes
 * the WASM module on first use:
 *
 * @example Basic encoding/decoding
 * ```ts
 * import { encode, decode, hexEncode } from "@zig-wasm/base64";
 *
 * // Encode string to Base64
 * const encoded = await encode("Hello, World!");
 * console.log(encoded); // "SGVsbG8sIFdvcmxkIQ=="
 *
 * // Decode Base64 to bytes
 * const decoded = await decode(encoded);
 * console.log(new TextDecoder().decode(decoded)); // "Hello, World!"
 *
 * // Hex encoding
 * const hex = await hexEncode("hello");
 * console.log(hex); // "68656c6c6f"
 * ```
 *
 * @example URL-safe encoding for web applications
 * ```ts
 * import { encodeUrl, encodeUrlNoPadding } from "@zig-wasm/base64";
 *
 * // URL-safe with padding
 * const urlSafe = await encodeUrl("Hello?World!");
 *
 * // URL-safe without padding (ideal for JWTs)
 * const jwtPart = await encodeUrlNoPadding(JSON.stringify({ alg: "HS256" }));
 * ```
 *
 * @example Synchronous API for performance-critical code
 * ```ts
 * import { init, encodeSync, decodeSync, isInitialized } from "@zig-wasm/base64";
 *
 * // Initialize once at startup
 * await init();
 *
 * // Check initialization status
 * console.log(isInitialized()); // true
 *
 * // Use sync functions in hot paths (no await needed)
 * const encoded = encodeSync("Hello");
 * const decoded = decodeSync(encoded);
 * ```
 *
 * @example Binary data handling
 * ```ts
 * import { encode, decode } from "@zig-wasm/base64";
 *
 * // Encode Uint8Array directly
 * const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff]);
 * const encoded = await encode(binaryData);
 *
 * // Decode always returns Uint8Array
 * const decoded = await decode(encoded);
 * console.log(decoded); // Uint8Array [0, 1, 2, 255]
 * ```
 *
 * @example Custom WASM loading
 * ```ts
 * import { init } from "@zig-wasm/base64";
 *
 * // Load from custom path
 * await init({ wasmPath: "./custom/base64.wasm" });
 *
 * // Or from URL
 * await init({ wasmUrl: "https://cdn.example.com/base64.wasm" });
 *
 * // Or from pre-loaded bytes
 * const bytes = await fetch("/base64.wasm").then(r => r.arrayBuffer());
 * await init({ wasmBytes: new Uint8Array(bytes) });
 * ```
 *
 * ## API Overview
 *
 * | Variant | Async | Sync | Description |
 * |---------|-------|------|-------------|
 * | Standard | {@link encode}/{@link decode} | {@link encodeSync}/{@link decodeSync} | RFC 4648 Base64 |
 * | No Padding | {@link encodeNoPadding}/{@link decodeNoPadding} | {@link encodeNoPaddingSync}/{@link decodeNoPaddingSync} | Standard without `=` |
 * | URL-safe | {@link encodeUrl}/{@link decodeUrl} | {@link encodeUrlSync}/{@link decodeUrlSync} | Uses `-_` instead of `+/` |
 * | URL-safe No Pad | {@link encodeUrlNoPadding}/{@link decodeUrlNoPadding} | {@link encodeUrlNoPaddingSync}/{@link decodeUrlNoPaddingSync} | Best for JWTs |
 * | Hex | {@link hexEncode}/{@link hexDecode} | {@link hexEncodeSync}/{@link hexDecodeSync} | Lowercase hex |
 *
 * @see {@link init} - Manual initialization for sync API
 * @see {@link isInitialized} - Check if module is ready
 * @see {@link encode} - Standard Base64 encoding
 * @see {@link decode} - Standard Base64 decoding
 * @see {@link Base64WasmExports} - Low-level WASM interface
 *
 * @module
 */

// Lifecycle
export { init, isInitialized } from "./base64.ts";

// Async API
// dprint-ignore
export {
  decode, decodeNoPadding, decodeUrl, decodeUrlNoPadding,
  encode, encodeNoPadding, encodeUrl, encodeUrlNoPadding,
  hexDecode, hexEncode,
} from "./base64.ts";

// Sync API
// dprint-ignore
export {
  decodeNoPaddingSync, decodeSync, decodeUrlNoPaddingSync, decodeUrlSync,
  encodeNoPaddingSync, encodeSync, encodeUrlNoPaddingSync, encodeUrlSync,
  hexDecodeSync, hexEncodeSync,
} from "./base64.ts";

// Types
export type { Base64WasmExports } from "./types.ts";

// Re-export error for convenience
export { NotInitializedError } from "@zig-wasm/core";
export type { InitOptions } from "@zig-wasm/core";
