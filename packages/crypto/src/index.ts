/**
 * @zig-wasm/crypto
 *
 * Cryptographic hash functions powered by Zig's std.crypto via WebAssembly
 */

// Types
export type { CryptoWasmExports, HashAlgorithm, HmacAlgorithm } from "./types.js";

// Hash functions
export {
  blake2b256,
  blake2s256,
  blake3,
  hash,
  hashHex,
  md5,
  sha1,
  sha256,
  sha384,
  sha3_256,
  sha3_512,
  sha512,
} from "./crypto.js";

// HMAC functions
export { hmac, hmacHex, hmacSha256, hmacSha512 } from "./crypto.js";

// Utilities
export { getHashDigestLength } from "./crypto.js";
