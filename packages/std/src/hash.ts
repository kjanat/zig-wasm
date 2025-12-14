/**
 * Non-cryptographic hash functions via Zig WebAssembly.
 *
 * This module provides high-performance non-cryptographic hashing including:
 * CRC32, Adler32, xxHash (32/64-bit), FNV-1a, MurmurHash, CityHash, and wyhash.
 * Ideal for checksums, hash tables, data integrity, and content addressing.
 *
 * This is a subpath re-export of {@link https://jsr.io/@zig-wasm/hash | @zig-wasm/hash}.
 * For the smallest bundle size, import directly from `@zig-wasm/hash`.
 *
 * @example CRC32 checksum
 * ```ts
 * import { crc32 } from "@zig-wasm/std/hash";
 *
 * const checksum = await crc32("hello world");
 * console.log(checksum); // Returns numeric checksum
 * ```
 *
 * @example xxHash for fast hashing
 * ```ts
 * import { xxhash32, xxhash64 } from "@zig-wasm/std/hash";
 *
 * const hash32 = await xxhash32("data");
 * const hash64 = await xxhash64("data");
 * ```
 *
 * @example Multiple hash algorithms
 * ```ts
 * import { adler32, fnv1a32, fnv1a64, murmur2_64, cityhash64, wyhash } from "@zig-wasm/std/hash";
 *
 * const data = "my data";
 * const adler = await adler32(data);
 * const fnv32 = await fnv1a32(data);
 * const murmur = await murmur2_64(data);
 * ```
 *
 * @example Synchronous API (requires init() first)
 * ```ts
 * import { init, crc32Sync, xxhash64Sync } from "@zig-wasm/std/hash";
 *
 * await init();
 * const checksum = crc32Sync("hello");
 * const hash = xxhash64Sync("data");
 * ```
 *
 * @module hash
 */
export * from "@zig-wasm/hash";
