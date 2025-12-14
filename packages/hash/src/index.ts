/**
 * Fast non-cryptographic hash functions powered by Zig via WebAssembly.
 *
 * This package provides high-performance hash functions compiled from Zig to WASM,
 * suitable for checksums, hash tables, data fingerprinting, and other non-security uses.
 *
 * ## Supported Algorithms
 *
 * **32-bit algorithms** (return `number`):
 * - {@link crc32} - CRC-32 checksum (IEEE polynomial)
 * - {@link adler32} - Adler-32 checksum (used in zlib)
 * - {@link xxhash32} - xxHash 32-bit (supports seed)
 * - {@link fnv1a32} - FNV-1a 32-bit hash
 *
 * **64-bit algorithms** (return `bigint`):
 * - {@link xxhash64} - xxHash 64-bit (supports seed)
 * - {@link wyhash} - wyhash (very fast, supports seed)
 * - {@link cityhash64} - Google CityHash 64-bit (supports seed)
 * - {@link murmur2_64} - MurmurHash2 64-bit (supports seed)
 * - {@link fnv1a64} - FNV-1a 64-bit hash
 *
 * ## API Variants
 *
 * Each algorithm has multiple API variants:
 * - **Async** (e.g., `crc32`): Auto-initializes WASM, returns Promise
 * - **Sync** (e.g., `crc32Sync`): Requires {@link init} first, synchronous
 * - **Hex** (e.g., `crc32Hex`): Returns lowercase hex string
 *
 * @example Basic usage (async)
 * ```ts
 * import { crc32, xxhash64, wyhash } from "@zig-wasm/hash";
 *
 * // CRC32 checksum (returns number)
 * const checksum = await crc32("Hello, World!");
 * console.log(checksum); // 3964322768
 *
 * // xxHash64 (returns bigint)
 * const hash = await xxhash64("data");
 * console.log(hash); // bigint
 *
 * // wyhash with custom seed
 * const seeded = await wyhash("data", 12345n);
 * ```
 *
 * @example Sync API (faster for repeated calls)
 * ```ts
 * import { init, crc32Sync, xxhash64Sync } from "@zig-wasm/hash";
 *
 * // Must initialize before using sync functions
 * await init();
 *
 * // Now sync calls work without await
 * const checksum = crc32Sync("Hello");
 * const hash = xxhash64Sync("Hello");
 * ```
 *
 * @example Hex output
 * ```ts
 * import { crc32Hex, xxhash64Hex, hashHex } from "@zig-wasm/hash";
 *
 * console.log(await crc32Hex("test"));    // "d87f7e0c"
 * console.log(await xxhash64Hex("test")); // "4fdcca5ddb678139"
 *
 * // Generic function for any algorithm
 * console.log(await hashHex("wyhash", "test"));
 * ```
 *
 * @example Binary data
 * ```ts
 * import { crc32 } from "@zig-wasm/hash";
 *
 * const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
 * const checksum = await crc32(data);
 * ```
 *
 * @example Generic hash functions
 * ```ts
 * import { hash, hash32, hash64, hashHex } from "@zig-wasm/hash";
 * import type { HashAlgorithm } from "@zig-wasm/hash";
 *
 * // hash() returns number or bigint depending on algorithm
 * const crc = await hash("crc32", "data");     // number
 * const wyhash = await hash("wyhash", "data"); // bigint
 *
 * // Type-safe variants
 * const n: number = await hash32("crc32", "data");
 * const b: bigint = await hash64("xxhash64", "data");
 *
 * // Iterate over algorithms
 * const algorithms: HashAlgorithm[] = ["crc32", "xxhash64", "wyhash"];
 * for (const algo of algorithms) {
 *   console.log(`${algo}: ${await hashHex(algo, "test")}`);
 * }
 * ```
 *
 * @module
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
