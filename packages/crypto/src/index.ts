/**
 * Cryptographic hash functions powered by Zig's std.crypto via WebAssembly.
 *
 * This package provides fast, secure cryptographic hash functions and HMAC
 * implementations compiled from Zig to WebAssembly. It works in Node.js,
 * Bun, Deno, and browsers.
 *
 * ## Supported Algorithms
 *
 * ### Hash Functions
 * | Algorithm | Output | Security | Notes |
 * |-----------|--------|----------|-------|
 * | {@link md5} | 128-bit | Broken | Legacy only |
 * | {@link sha1} | 160-bit | Weak | Legacy only |
 * | {@link sha256} | 256-bit | Strong | Recommended |
 * | {@link sha384} | 384-bit | Strong | SHA-2 family |
 * | {@link sha512} | 512-bit | Strong | SHA-2 family |
 * | {@link sha3_256} | 256-bit | Strong | Keccak-based |
 * | {@link sha3_512} | 512-bit | Strong | Keccak-based |
 * | {@link blake2b256} | 256-bit | Strong | Fast, 64-bit optimized |
 * | {@link blake2s256} | 256-bit | Strong | Fast, 32-bit optimized |
 * | {@link blake3} | 256-bit | Strong | Fastest, modern |
 *
 * ### HMAC (Message Authentication)
 * | Function | Output | Use Case |
 * |----------|--------|----------|
 * | {@link hmacSha256} | 256-bit | API auth, JWT signing |
 * | {@link hmacSha512} | 512-bit | High security margin |
 *
 * ## API Variants
 *
 * - **Async API** (recommended): Auto-initializes WASM, returns Promises
 * - **Sync API**: Requires {@link init} first, returns values directly
 *
 * @example Basic hashing (async)
 * ```ts
 * import { sha256, blake3, hashHex } from "@zig-wasm/crypto";
 *
 * // Hash with SHA-256
 * const hash = await sha256("Hello, World!");
 * console.log(hash); // Uint8Array(32)
 *
 * // Get hash as hex string
 * const hex = await hashHex("sha256", "Hello");
 * console.log(hex); // "185f8db32271fe25f561a6fc938b2e26..."
 *
 * // Use BLAKE3 for best performance
 * const fast = await blake3("large data...");
 * ```
 *
 * @example HMAC for authentication
 * ```ts
 * import { hmacSha256, hmacHex } from "@zig-wasm/crypto";
 *
 * // Generate signature for API request
 * const signature = await hmacSha256("secret-key", "request-body");
 *
 * // Get signature as hex for HTTP headers
 * const signatureHex = await hmacHex("sha256", "secret-key", "request-body");
 * ```
 *
 * @example Sync API for performance-critical code
 * ```ts
 * import { init, sha256Sync, hmacSha256Sync } from "@zig-wasm/crypto";
 *
 * // Initialize once at startup
 * await init();
 *
 * // Now use sync functions without await
 * const hash = sha256Sync("Hello");
 * const mac = hmacSha256Sync("key", "data");
 * ```
 *
 * @example Hash binary data
 * ```ts
 * import { sha256 } from "@zig-wasm/crypto";
 *
 * const binaryData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
 * const hash = await sha256(binaryData);
 * ```
 *
 * @example Compare algorithms
 * ```ts
 * import { hash, type HashAlgorithm } from "@zig-wasm/crypto";
 *
 * const algorithms: HashAlgorithm[] = ["sha256", "sha3-256", "blake3"];
 * const data = "test data";
 *
 * for (const algo of algorithms) {
 *   const digest = await hash(algo, data);
 *   console.log(`${algo}: ${digest.length} bytes`);
 * }
 * ```
 *
 * @module
 */

// Lifecycle
export { init, isInitialized } from "./crypto.ts";

// Async API
// dprint-ignore
export {
  blake2b256, blake2s256, blake3,
  getHashDigestLength,
  hash, hashHex,
  hmac, hmacHex, hmacSha256, hmacSha512,
  md5,
  sha1, sha256, sha384, sha3_256, sha3_512, sha512,
} from "./crypto.ts";

// Sync API
// dprint-ignore
export {
  blake2b256Sync, blake2s256Sync, blake3Sync,
  getHashDigestLengthSync,
  hashHexSync, hashSync,
  hmacHexSync, hmacSha256Sync, hmacSha512Sync, hmacSync,
  md5Sync,
  sha1Sync, sha256Sync, sha384Sync, sha3_256Sync, sha3_512Sync, sha512Sync,
} from "./crypto.ts";

// Types
export type { CryptoWasmExports, HashAlgorithm, HmacAlgorithm } from "./types.ts";

// Re-export error for convenience
export { NotInitializedError } from "@zig-wasm/core";
export type { InitOptions } from "@zig-wasm/core";
