/**
 * Base64 encoding and decoding via Zig WebAssembly.
 *
 * This module provides high-performance Base64 operations supporting multiple variants:
 * standard (RFC 4648), URL-safe, with or without padding.
 *
 * This is a subpath re-export of {@link https://jsr.io/@zig-wasm/base64 | @zig-wasm/base64}.
 * For the smallest bundle size, import directly from `@zig-wasm/base64`.
 *
 * @example Basic encoding and decoding
 * ```ts
 * import { encode, decode } from "@zig-wasm/std/base64";
 *
 * // Encode a string to Base64
 * const encoded = await encode("Hello, World!");
 * console.log(encoded); // "SGVsbG8sIFdvcmxkIQ=="
 *
 * // Decode back to string
 * const decoded = await decode(encoded);
 * console.log(decoded); // "Hello, World!"
 * ```
 *
 * @example URL-safe Base64
 * ```ts
 * import { encodeUrl, decodeUrl } from "@zig-wasm/std/base64";
 *
 * // URL-safe encoding (uses - and _ instead of + and /)
 * const encoded = await encodeUrl("data with special chars");
 * ```
 *
 * @example Synchronous API (requires init() first)
 * ```ts
 * import { init, encodeSync, decodeSync } from "@zig-wasm/std/base64";
 *
 * await init();
 * const encoded = encodeSync("hello");
 * const decoded = decodeSync(encoded);
 * ```
 *
 * @module base64
 */
export * from "@zig-wasm/base64";
