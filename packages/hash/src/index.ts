/**
 * @zig-wasm/hash
 *
 * Fast non-cryptographic hash functions powered by Zig via WebAssembly
 */

// Lifecycle
export { init, isInitialized } from "./hash.ts";

// Async API
// dprint-ignore
export {
  adler32, adler32Hex,
  cityhash64, cityhash64Hex,
  crc32, crc32Hex,
  fnv1a32, fnv1a32Hex, fnv1a64, fnv1a64Hex,
  hash, hash32, hash64, hashHex,
  murmur2_64, murmur2_64Hex,
  wyhash, wyhashHex,
  xxhash32, xxhash32Hex, xxhash64, xxhash64Hex,
} from "./hash.ts";

// Sync API
// dprint-ignore
export {
  adler32HexSync, adler32Sync,
  cityhash64HexSync, cityhash64Sync,
  crc32HexSync, crc32Sync,
  fnv1a32HexSync, fnv1a32Sync, fnv1a64HexSync, fnv1a64Sync,
  hash32Sync, hash64Sync, hashHexSync, hashSync,
  murmur2_64HexSync, murmur2_64Sync,
  wyhashHexSync, wyhashSync,
  xxhash32HexSync, xxhash32Sync, xxhash64HexSync, xxhash64Sync,
} from "./hash.ts";

// Types
export type { Hash32Algorithm, Hash64Algorithm, HashAlgorithm, HashWasmExports } from "./types.ts";

// Re-export error for convenience
export { NotInitializedError } from "@zig-wasm/core";
export type { InitOptions } from "@zig-wasm/core";
