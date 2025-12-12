/**
 * @zig-wasm/crypto
 *
 * Cryptographic hash functions powered by Zig's std.crypto via WebAssembly
 */

// Hash functions
// HMAC functions
// Utilities
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
} from "./crypto.js";
// Types
export type { CryptoWasmExports, HashAlgorithm, HmacAlgorithm } from "./types.js";
