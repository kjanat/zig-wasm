/**
 * @zig-wasm/crypto
 *
 * Cryptographic hash functions powered by Zig's std.crypto via WebAssembly
 */

// Lifecycle
export { init, isInitialized } from "./crypto.ts";

// Async API
export {
  blake2b256,
  blake2s256,
  blake3,
  getHashDigestLength,
  hash,
  hashHex,
  hmac,
  hmacHex,
  hmacSha256,
  hmacSha512,
  md5,
  sha1,
  sha256,
  sha384,
  sha3_256,
  sha3_512,
  sha512,
} from "./crypto.ts";

// Sync API
export {
  blake2b256Sync,
  blake2s256Sync,
  blake3Sync,
  getHashDigestLengthSync,
  hashHexSync,
  hashSync,
  hmacHexSync,
  hmacSha256Sync,
  hmacSha512Sync,
  hmacSync,
  md5Sync,
  sha1Sync,
  sha256Sync,
  sha384Sync,
  sha3_256Sync,
  sha3_512Sync,
  sha512Sync,
} from "./crypto.ts";

// Types
export type { CryptoWasmExports, HashAlgorithm, HmacAlgorithm } from "./types.ts";

// Re-export error for convenience
export { NotInitializedError } from "@zig-wasm/core";
export type { InitOptions } from "@zig-wasm/core";
