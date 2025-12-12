/**
 * @zig-wasm/hash
 *
 * Fast non-cryptographic hash functions powered by Zig via WebAssembly
 */

// Generic hash functions
// CRC32 & Adler32
// xxHash
// wyHash
// CityHash
// MurmurHash
// FNV-1a
export {
  adler32,
  adler32Hex,
  cityhash64,
  cityhash64Hex,
  crc32,
  crc32Hex,
  fnv1a32,
  fnv1a32Hex,
  fnv1a64,
  fnv1a64Hex,
  hash,
  hash32,
  hash64,
  hashHex,
  murmur2_64,
  murmur2_64Hex,
  wyhash,
  wyhashHex,
  xxhash32,
  xxhash32Hex,
  xxhash64,
  xxhash64Hex,
} from "./hash.ts";
// Types
export type { Hash32Algorithm, Hash64Algorithm, HashAlgorithm, HashWasmExports } from "./types.ts";
