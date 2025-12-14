/**
 * Cryptographic hash functions and HMAC via Zig WebAssembly.
 *
 * This module provides high-performance cryptographic hashing including:
 * MD5, SHA-1, SHA-2 family (SHA-256, SHA-384, SHA-512), SHA-3, BLAKE2, and BLAKE3.
 * Also includes HMAC for message authentication.
 *
 * This is a subpath re-export of {@link https://jsr.io/@zig-wasm/crypto | @zig-wasm/crypto}.
 * For the smallest bundle size, import directly from `@zig-wasm/crypto`.
 *
 * @example SHA-256 hashing
 * ```ts
 * import { sha256 } from "@zig-wasm/std/crypto";
 *
 * const hash = await sha256("hello world");
 * console.log(hash); // "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
 * ```
 *
 * @example Multiple hash algorithms
 * ```ts
 * import { md5, sha1, sha512, blake3 } from "@zig-wasm/std/crypto";
 *
 * const data = "my data";
 * const md5Hash = await md5(data);
 * const sha1Hash = await sha1(data);
 * const sha512Hash = await sha512(data);
 * const blake3Hash = await blake3(data);
 * ```
 *
 * @example HMAC authentication
 * ```ts
 * import { hmacSha256 } from "@zig-wasm/std/crypto";
 *
 * const mac = await hmacSha256("secret-key", "message to authenticate");
 * ```
 *
 * @example Synchronous API (requires init() first)
 * ```ts
 * import { init, sha256Sync, hmacSha256Sync } from "@zig-wasm/std/crypto";
 *
 * await init();
 * const hash = sha256Sync("hello");
 * const mac = hmacSha256Sync("key", "message");
 * ```
 *
 * @module crypto
 */
export * from "@zig-wasm/crypto";
