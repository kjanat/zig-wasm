/**
 * @zig-wasm/hash
 *
 * Fast non-cryptographic hash functions powered by Zig via WebAssembly
 */

// Types
export type {
  HashWasmExports,
  Hash32Algorithm,
  Hash64Algorithm,
  HashAlgorithm,
} from "./types.js";

// Generic hash functions
export { hash, hash32, hash64, hashHex } from "./hash.js";

// CRC32 & Adler32
export { crc32, crc32Hex, adler32, adler32Hex } from "./hash.js";

// xxHash
export { xxhash64, xxhash64Hex, xxhash32, xxhash32Hex } from "./hash.js";

// wyHash
export { wyhash, wyhashHex } from "./hash.js";

// CityHash
export { cityhash64, cityhash64Hex } from "./hash.js";

// MurmurHash
export { murmur2_64, murmur2_64Hex } from "./hash.js";

// FNV-1a
export { fnv1a64, fnv1a64Hex, fnv1a32, fnv1a32Hex } from "./hash.js";
