/**
 * Type definitions for the @zig-wasm/hash module.
 *
 * This module exports types for hash algorithm names and WASM exports.
 * All 32-bit algorithms return `number`, all 64-bit algorithms return `bigint`.
 *
 * @example Algorithm selection
 * ```ts
 * import type { Hash32Algorithm, Hash64Algorithm, HashAlgorithm } from "@zig-wasm/hash";
 *
 * // 32-bit algorithms return number
 * const algo32: Hash32Algorithm = "crc32";
 *
 * // 64-bit algorithms return bigint
 * const algo64: Hash64Algorithm = "xxhash64";
 *
 * // Union of all algorithms
 * const algo: HashAlgorithm = "wyhash";
 * ```
 *
 * @module types
 */

import type { WasmMemoryExports } from "@zig-wasm/core";

/**
 * WASM exports for the hash module.
 *
 * These are the low-level functions exported from the compiled Zig WASM module.
 * You typically don't need to use these directly - use the high-level API instead.
 *
 * All functions take a pointer and length to data in WASM linear memory.
 * 32-bit functions return `number`, 64-bit functions return `bigint`.
 * Seeded variants accept an additional seed parameter.
 */
export interface HashWasmExports extends WasmMemoryExports {
  /** Index signature for dynamic access */
  [key: string]: unknown;

  /**
   * Compute CRC32 checksum.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 32-bit CRC32 checksum
   */
  crc32: (dataPtr: number, dataLen: number) => number;

  /**
   * Compute Adler-32 checksum.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 32-bit Adler-32 checksum
   */
  adler32: (dataPtr: number, dataLen: number) => number;

  /**
   * Compute xxHash64 with default seed.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit xxHash64 value
   */
  xxhash64: (dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute xxHash64 with custom seed.
   * @param seed - 64-bit seed value
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit xxHash64 value
   */
  xxhash64_seeded: (seed: bigint, dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute xxHash32 with default seed.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 32-bit xxHash32 value
   */
  xxhash32: (dataPtr: number, dataLen: number) => number;

  /**
   * Compute xxHash32 with custom seed.
   * @param seed - 32-bit seed value
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 32-bit xxHash32 value
   */
  xxhash32_seeded: (seed: number, dataPtr: number, dataLen: number) => number;

  /**
   * Compute wyhash with default seed.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit wyhash value
   */
  wyhash: (dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute wyhash with custom seed.
   * @param seed - 64-bit seed value
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit wyhash value
   */
  wyhash_seeded: (seed: bigint, dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute CityHash64 with default seed.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit CityHash64 value
   */
  cityhash64: (dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute CityHash64 with custom seed.
   * @param seed - 64-bit seed value
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit CityHash64 value
   */
  cityhash64_seeded: (seed: bigint, dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute Murmur2-64 with default seed.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit Murmur2-64 value
   */
  murmur2_64: (dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute Murmur2-64 with custom seed.
   * @param seed - 64-bit seed value
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit Murmur2-64 value
   */
  murmur2_64_seeded: (seed: bigint, dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute FNV-1a 64-bit hash.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 64-bit FNV-1a hash value
   */
  fnv1a_64: (dataPtr: number, dataLen: number) => bigint;

  /**
   * Compute FNV-1a 32-bit hash.
   * @param dataPtr - Pointer to data in WASM memory
   * @param dataLen - Length of data in bytes
   * @returns 32-bit FNV-1a hash value
   */
  fnv1a_32: (dataPtr: number, dataLen: number) => number;
}

/**
 * 32-bit hash algorithm identifiers.
 *
 * These algorithms all return a `number` (32-bit unsigned integer):
 * - `"crc32"` - CRC-32 checksum (IEEE polynomial)
 * - `"adler32"` - Adler-32 checksum (used in zlib)
 * - `"xxhash32"` - xxHash 32-bit variant (supports seed)
 * - `"fnv1a32"` - FNV-1a 32-bit hash
 *
 * @example
 * ```ts
 * import { hash32 } from "@zig-wasm/hash";
 *
 * const crc = await hash32("crc32", "data");      // number
 * const adler = await hash32("adler32", "data");  // number
 * const xx32 = await hash32("xxhash32", "data");  // number
 * const fnv32 = await hash32("fnv1a32", "data");  // number
 * ```
 */
export type Hash32Algorithm = "crc32" | "adler32" | "xxhash32" | "fnv1a32";

/**
 * 64-bit hash algorithm identifiers.
 *
 * These algorithms all return a `bigint` (64-bit unsigned integer):
 * - `"xxhash64"` - xxHash 64-bit variant (supports seed)
 * - `"wyhash"` - wyhash (very fast, supports seed)
 * - `"cityhash64"` - Google CityHash 64-bit (supports seed)
 * - `"murmur2_64"` - MurmurHash2 64-bit variant (supports seed)
 * - `"fnv1a64"` - FNV-1a 64-bit hash
 *
 * @example
 * ```ts
 * import { hash64 } from "@zig-wasm/hash";
 *
 * const xx64 = await hash64("xxhash64", "data");    // bigint
 * const wy = await hash64("wyhash", "data");        // bigint
 * const city = await hash64("cityhash64", "data");  // bigint
 * const murmur = await hash64("murmur2_64", "data"); // bigint
 * const fnv64 = await hash64("fnv1a64", "data");    // bigint
 * ```
 */
export type Hash64Algorithm =
  | "xxhash64"
  | "wyhash"
  | "cityhash64"
  | "murmur2_64"
  | "fnv1a64";

/**
 * Union of all hash algorithm identifiers.
 *
 * Use with {@link hash} or {@link hashHex} to compute any supported hash.
 * Returns `number` for 32-bit algorithms, `bigint` for 64-bit algorithms.
 *
 * @example
 * ```ts
 * import { hash, hashHex } from "@zig-wasm/hash";
 * import type { HashAlgorithm } from "@zig-wasm/hash";
 *
 * const algorithms: HashAlgorithm[] = ["crc32", "xxhash64", "wyhash"];
 *
 * for (const algo of algorithms) {
 *   const hex = await hashHex(algo, "Hello, World!");
 *   console.log(`${algo}: ${hex}`);
 * }
 * ```
 */
export type HashAlgorithm = Hash32Algorithm | Hash64Algorithm;
