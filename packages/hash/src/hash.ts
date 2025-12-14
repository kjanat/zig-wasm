/**
 * Non-cryptographic hash functions implementation.
 *
 * This module provides fast hash functions powered by Zig compiled to WebAssembly.
 * All functions accept either a string (UTF-8 encoded) or `Uint8Array` as input.
 *
 * **Supported algorithms:**
 * - **32-bit** (return `number`): CRC32, Adler32, xxHash32, FNV-1a 32
 * - **64-bit** (return `bigint`): xxHash64, wyhash, CityHash64, Murmur2-64, FNV-1a 64
 *
 * **API variants:**
 * - **Async** (e.g., {@link crc32}): Auto-initializes WASM on first call
 * - **Sync** (e.g., {@link crc32Sync}): Requires calling {@link init} first
 * - **Hex** (e.g., {@link crc32Hex}): Returns hash as lowercase hex string
 *
 * @example Basic async usage
 * ```ts
 * import { crc32, xxhash64, wyhash } from "@zig-wasm/hash";
 *
 * // 32-bit hash returns number
 * const checksum = await crc32("Hello, World!");
 * console.log(checksum); // 3964322768
 *
 * // 64-bit hash returns bigint
 * const hash = await xxhash64("Hello, World!");
 * console.log(hash); // 17691043854468224118n
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
 * const crc = crc32Sync("test");
 * const hash = xxhash64Sync("test");
 * ```
 *
 * @example Hex output
 * ```ts
 * import { crc32Hex, xxhash64Hex } from "@zig-wasm/hash";
 *
 * console.log(await crc32Hex("test"));    // "d87f7e0c"
 * console.log(await xxhash64Hex("test")); // "4fdcca5ddb678139"
 * ```
 *
 * @module hash
 */

import type { AllocationScope as AllocationScopeType, InitOptions } from "@zig-wasm/core";
import { AllocationScope, getEnvironment, loadWasm, NotInitializedError, WasmMemory } from "@zig-wasm/core";
import type { Hash32Algorithm, Hash64Algorithm, HashAlgorithm, HashWasmExports } from "./types.ts";

// ============================================================================
// Module initialization
// ============================================================================

let wasmExports: HashWasmExports | null = null;
let wasmMemory: WasmMemory | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the hash module.
 *
 * This function is idempotent and concurrency-safe. Multiple calls will
 * return the same promise. Required before using sync API functions.
 * Async API functions call this automatically.
 *
 * @param options - Optional initialization options for custom WASM loading
 * @returns Promise that resolves when initialization is complete
 *
 * @example Default initialization
 * ```ts
 * import { init, crc32Sync } from "@zig-wasm/hash";
 *
 * await init();
 * const hash = crc32Sync("data"); // Now works
 * ```
 *
 * @example Custom WASM path
 * ```ts
 * import { init } from "@zig-wasm/hash";
 *
 * await init({ wasmPath: "/custom/path/hash.wasm" });
 * ```
 *
 * @example Custom WASM bytes (for bundlers)
 * ```ts
 * import { init } from "@zig-wasm/hash";
 * import wasmBytes from "./hash.wasm?arraybuffer";
 *
 * await init({ wasmBytes: new Uint8Array(wasmBytes) });
 * ```
 */
export async function init(options?: InitOptions): Promise<void> {
  if (wasmExports) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    const env = getEnvironment();
    let result: Awaited<ReturnType<typeof loadWasm<HashWasmExports>>>;

    if (options?.wasmBytes) {
      result = await loadWasm<HashWasmExports>({ wasmBytes: options.wasmBytes, imports: options.imports });
    } else if (options?.wasmPath) {
      result = await loadWasm<HashWasmExports>({ wasmPath: options.wasmPath, imports: options.imports });
    } else if (options?.wasmUrl) {
      result = await loadWasm<HashWasmExports>({ wasmUrl: options.wasmUrl, imports: options.imports });
    } else if (env.isNode || env.isBun) {
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "../wasm/hash.wasm");
      result = await loadWasm<HashWasmExports>({ wasmPath });
    } else {
      const wasmUrl = new URL("../wasm/hash.wasm", import.meta.url);
      result = await loadWasm<HashWasmExports>({ wasmUrl: wasmUrl.href });
    }

    wasmExports = result.exports;
    wasmMemory = new WasmMemory(result.exports);
  })();

  await initPromise;
}

/**
 * Check if the module is initialized.
 *
 * Use this to check if sync functions can be called without throwing
 * {@link NotInitializedError}.
 *
 * @returns `true` if {@link init} has completed, `false` otherwise
 *
 * @example
 * ```ts
 * import { init, isInitialized, crc32Sync } from "@zig-wasm/hash";
 *
 * console.log(isInitialized()); // false
 * await init();
 * console.log(isInitialized()); // true
 * ```
 */
export function isInitialized(): boolean {
  return wasmExports !== null;
}

async function ensureInit(): Promise<{ exports: HashWasmExports; memory: WasmMemory }> {
  await init();
  return { exports: wasmExports as HashWasmExports, memory: wasmMemory as WasmMemory };
}

function getSyncState(): { exports: HashWasmExports; memory: WasmMemory } {
  if (!wasmExports || !wasmMemory) {
    throw new NotInitializedError("hash");
  }
  return { exports: wasmExports, memory: wasmMemory };
}

// ============================================================================
// Utilities
// ============================================================================

function toBytes(data: string | Uint8Array): Uint8Array {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data;
}

function toHex32(n: number): string {
  return n.toString(16).padStart(8, "0");
}

function toHex64(n: bigint): string {
  return n.toString(16).padStart(16, "0");
}

function is32BitAlgorithm(algorithm: HashAlgorithm): algorithm is Hash32Algorithm {
  return algorithm === "crc32" || algorithm === "adler32" || algorithm === "xxhash32" || algorithm === "fnv1a32";
}

// ============================================================================
// Internal implementations
// ============================================================================

function hash32Impl(
  exports: HashWasmExports,
  mem: WasmMemory,
  algorithm: Hash32Algorithm,
  data: Uint8Array,
  seed?: number,
): number {
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);

    switch (algorithm) {
      case "crc32":
        return exports.crc32(input.ptr, input.len);
      case "adler32":
        return exports.adler32(input.ptr, input.len);
      case "xxhash32":
        return seed !== undefined
          ? exports.xxhash32_seeded(seed, input.ptr, input.len)
          : exports.xxhash32(input.ptr, input.len);
      case "fnv1a32":
        return exports.fnv1a_32(input.ptr, input.len);
    }
  });
}

function hash64Impl(
  exports: HashWasmExports,
  mem: WasmMemory,
  algorithm: Hash64Algorithm,
  data: Uint8Array,
  seed?: bigint,
): bigint {
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);

    switch (algorithm) {
      case "xxhash64":
        return seed !== undefined
          ? exports.xxhash64_seeded(seed, input.ptr, input.len)
          : exports.xxhash64(input.ptr, input.len);
      case "wyhash":
        return seed !== undefined
          ? exports.wyhash_seeded(seed, input.ptr, input.len)
          : exports.wyhash(input.ptr, input.len);
      case "cityhash64":
        return seed !== undefined
          ? exports.cityhash64_seeded(seed, input.ptr, input.len)
          : exports.cityhash64(input.ptr, input.len);
      case "murmur2_64":
        return seed !== undefined
          ? exports.murmur2_64_seeded(seed, input.ptr, input.len)
          : exports.murmur2_64(input.ptr, input.len);
      case "fnv1a64":
        return exports.fnv1a_64(input.ptr, input.len);
    }
  });
}

// ============================================================================
// Async API
// ============================================================================

/**
 * Hash data with a 32-bit algorithm.
 *
 * Auto-initializes the WASM module on first call. For repeated calls,
 * consider using {@link init} + {@link hash32Sync} for better performance.
 *
 * @param algorithm - The 32-bit hash algorithm to use
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional seed (only used by xxhash32)
 * @returns 32-bit hash value as number
 *
 * @example
 * ```ts
 * import { hash32 } from "@zig-wasm/hash";
 *
 * const crc = await hash32("crc32", "Hello");
 * const xxh = await hash32("xxhash32", "Hello", 42);
 * ```
 */
export async function hash32(algorithm: Hash32Algorithm, data: string | Uint8Array, seed?: number): Promise<number> {
  const { exports, memory } = await ensureInit();
  return hash32Impl(exports, memory, algorithm, toBytes(data), seed);
}

/**
 * Hash data with a 64-bit algorithm.
 *
 * Auto-initializes the WASM module on first call. For repeated calls,
 * consider using {@link init} + {@link hash64Sync} for better performance.
 *
 * @param algorithm - The 64-bit hash algorithm to use
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional seed (bigint, not used by fnv1a64)
 * @returns 64-bit hash value as bigint
 *
 * @example
 * ```ts
 * import { hash64 } from "@zig-wasm/hash";
 *
 * const hash = await hash64("xxhash64", "Hello");
 * const seeded = await hash64("wyhash", "Hello", 12345n);
 * ```
 */
export async function hash64(algorithm: Hash64Algorithm, data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  const { exports, memory } = await ensureInit();
  return hash64Impl(exports, memory, algorithm, toBytes(data), seed);
}

/**
 * Hash data with any algorithm.
 *
 * Returns `number` for 32-bit algorithms, `bigint` for 64-bit algorithms.
 * Use {@link hash32} or {@link hash64} for type-safe returns.
 *
 * @param algorithm - Any supported hash algorithm
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns Hash value (number for 32-bit, bigint for 64-bit)
 *
 * @example
 * ```ts
 * import { hash } from "@zig-wasm/hash";
 *
 * const crc = await hash("crc32", "data");     // number
 * const wyhash = await hash("wyhash", "data"); // bigint
 * ```
 */
export async function hash(algorithm: HashAlgorithm, data: string | Uint8Array): Promise<number | bigint> {
  if (is32BitAlgorithm(algorithm)) {
    return hash32(algorithm, data);
  }
  return hash64(algorithm, data);
}

/**
 * Hash data and return as lowercase hex string.
 *
 * 32-bit algorithms return 8-character hex, 64-bit return 16-character hex.
 *
 * @param algorithm - Any supported hash algorithm
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns Hash as lowercase hex string (8 or 16 chars)
 *
 * @example
 * ```ts
 * import { hashHex } from "@zig-wasm/hash";
 *
 * console.log(await hashHex("crc32", "test"));    // "d87f7e0c" (8 chars)
 * console.log(await hashHex("xxhash64", "test")); // "4fdcca5ddb678139" (16 chars)
 * ```
 */
export async function hashHex(algorithm: HashAlgorithm, data: string | Uint8Array): Promise<string> {
  if (is32BitAlgorithm(algorithm)) {
    return toHex32(await hash32(algorithm, data));
  }
  return toHex64(await hash64(algorithm, data));
}

/**
 * Compute CRC-32 checksum.
 *
 * Uses the IEEE polynomial (0xEDB88320). Commonly used for data integrity
 * checks in ZIP, PNG, and network protocols.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 32-bit CRC checksum as number
 *
 * @example
 * ```ts
 * import { crc32 } from "@zig-wasm/hash";
 *
 * const checksum = await crc32("Hello, World!");
 * console.log(checksum);           // 3964322768
 * console.log(checksum.toString(16)); // "ec4ac3d0"
 * ```
 */
export async function crc32(data: string | Uint8Array): Promise<number> {
  return hash32("crc32", data);
}

/**
 * Compute CRC-32 checksum as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 8-character lowercase hex string
 *
 * @example
 * ```ts
 * import { crc32Hex } from "@zig-wasm/hash";
 *
 * console.log(await crc32Hex("Hello, World!")); // "ec4ac3d0"
 * ```
 */
export async function crc32Hex(data: string | Uint8Array): Promise<string> {
  return toHex32(await crc32(data));
}

/**
 * Compute Adler-32 checksum.
 *
 * Faster than CRC-32 but with weaker error detection. Used in zlib compression.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 32-bit Adler checksum as number
 *
 * @example
 * ```ts
 * import { adler32 } from "@zig-wasm/hash";
 *
 * const checksum = await adler32("Hello, World!");
 * console.log(checksum); // 530449859
 * ```
 */
export async function adler32(data: string | Uint8Array): Promise<number> {
  return hash32("adler32", data);
}

/**
 * Compute Adler-32 checksum as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 8-character lowercase hex string
 *
 * @example
 * ```ts
 * import { adler32Hex } from "@zig-wasm/hash";
 *
 * console.log(await adler32Hex("Hello, World!")); // "1f9e046b"
 * ```
 */
export async function adler32Hex(data: string | Uint8Array): Promise<string> {
  return toHex32(await adler32(data));
}

/**
 * Compute xxHash64.
 *
 * Very fast non-cryptographic hash with excellent distribution.
 * Suitable for hash tables, checksums, and data fingerprinting.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 64-bit hash as bigint
 *
 * @example
 * ```ts
 * import { xxhash64 } from "@zig-wasm/hash";
 *
 * const hash = await xxhash64("Hello, World!");
 * console.log(hash); // 17691043854468224118n
 *
 * // With custom seed
 * const seeded = await xxhash64("Hello", 42n);
 * ```
 */
export async function xxhash64(data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  return hash64("xxhash64", data, seed);
}

/**
 * Compute xxHash64 as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 16-character lowercase hex string
 *
 * @example
 * ```ts
 * import { xxhash64Hex } from "@zig-wasm/hash";
 *
 * console.log(await xxhash64Hex("test")); // "4fdcca5ddb678139"
 * ```
 */
export async function xxhash64Hex(data: string | Uint8Array, seed?: bigint): Promise<string> {
  return toHex64(await xxhash64(data, seed));
}

/**
 * Compute xxHash32.
 *
 * 32-bit variant of xxHash. Fast with good distribution.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 32-bit seed (default: 0)
 * @returns 32-bit hash as number
 *
 * @example
 * ```ts
 * import { xxhash32 } from "@zig-wasm/hash";
 *
 * const hash = await xxhash32("Hello");
 * const seeded = await xxhash32("Hello", 42);
 * ```
 */
export async function xxhash32(data: string | Uint8Array, seed?: number): Promise<number> {
  return hash32("xxhash32", data, seed);
}

/**
 * Compute xxHash32 as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 32-bit seed (default: 0)
 * @returns 8-character lowercase hex string
 *
 * @example
 * ```ts
 * import { xxhash32Hex } from "@zig-wasm/hash";
 *
 * console.log(await xxhash32Hex("test")); // "3e2023cf"
 * ```
 */
export async function xxhash32Hex(data: string | Uint8Array, seed?: number): Promise<string> {
  return toHex32(await xxhash32(data, seed));
}

/**
 * Compute wyhash.
 *
 * Extremely fast hash function with excellent quality. One of the fastest
 * hash functions available. Ideal for hash tables and checksums.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 64-bit hash as bigint
 *
 * @example
 * ```ts
 * import { wyhash } from "@zig-wasm/hash";
 *
 * const hash = await wyhash("Hello, World!");
 *
 * // With custom seed for different hash families
 * const seeded = await wyhash("key", 12345n);
 * ```
 */
export async function wyhash(data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  return hash64("wyhash", data, seed);
}

/**
 * Compute wyhash as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 16-character lowercase hex string
 *
 * @example
 * ```ts
 * import { wyhashHex } from "@zig-wasm/hash";
 *
 * console.log(await wyhashHex("test")); // 16-char hex
 * ```
 */
export async function wyhashHex(data: string | Uint8Array, seed?: bigint): Promise<string> {
  return toHex64(await wyhash(data, seed));
}

/**
 * Compute CityHash64.
 *
 * Google's CityHash 64-bit variant. Fast with good distribution.
 * Well-suited for hash tables.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 64-bit hash as bigint
 *
 * @example
 * ```ts
 * import { cityhash64 } from "@zig-wasm/hash";
 *
 * const hash = await cityhash64("Hello, World!");
 * const seeded = await cityhash64("key", 42n);
 * ```
 */
export async function cityhash64(data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  return hash64("cityhash64", data, seed);
}

/**
 * Compute CityHash64 as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 16-character lowercase hex string
 *
 * @example
 * ```ts
 * import { cityhash64Hex } from "@zig-wasm/hash";
 *
 * console.log(await cityhash64Hex("test")); // 16-char hex
 * ```
 */
export async function cityhash64Hex(data: string | Uint8Array, seed?: bigint): Promise<string> {
  return toHex64(await cityhash64(data, seed));
}

/**
 * Compute Murmur2-64 hash.
 *
 * MurmurHash2 64-bit variant. Classic non-cryptographic hash with
 * good speed and distribution.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 64-bit hash as bigint
 *
 * @example
 * ```ts
 * import { murmur2_64 } from "@zig-wasm/hash";
 *
 * const hash = await murmur2_64("Hello, World!");
 * const seeded = await murmur2_64("key", 42n);
 * ```
 */
export async function murmur2_64(data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  return hash64("murmur2_64", data, seed);
}

/**
 * Compute Murmur2-64 hash as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 16-character lowercase hex string
 *
 * @example
 * ```ts
 * import { murmur2_64Hex } from "@zig-wasm/hash";
 *
 * console.log(await murmur2_64Hex("test")); // 16-char hex
 * ```
 */
export async function murmur2_64Hex(data: string | Uint8Array, seed?: bigint): Promise<string> {
  return toHex64(await murmur2_64(data, seed));
}

/**
 * Compute FNV-1a 64-bit hash.
 *
 * Fowler-Noll-Vo hash function (FNV-1a variant). Simple and fast,
 * commonly used in hash tables. Does not support seeding.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 64-bit hash as bigint
 *
 * @example
 * ```ts
 * import { fnv1a64 } from "@zig-wasm/hash";
 *
 * const hash = await fnv1a64("Hello, World!");
 * console.log(hash); // bigint
 * ```
 */
export async function fnv1a64(data: string | Uint8Array): Promise<bigint> {
  return hash64("fnv1a64", data);
}

/**
 * Compute FNV-1a 64-bit hash as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 16-character lowercase hex string
 *
 * @example
 * ```ts
 * import { fnv1a64Hex } from "@zig-wasm/hash";
 *
 * console.log(await fnv1a64Hex("test")); // 16-char hex
 * ```
 */
export async function fnv1a64Hex(data: string | Uint8Array): Promise<string> {
  return toHex64(await fnv1a64(data));
}

/**
 * Compute FNV-1a 32-bit hash.
 *
 * Fowler-Noll-Vo hash function (FNV-1a variant), 32-bit version.
 * Simple and fast for small data. Does not support seeding.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 32-bit hash as number
 *
 * @example
 * ```ts
 * import { fnv1a32 } from "@zig-wasm/hash";
 *
 * const hash = await fnv1a32("Hello, World!");
 * console.log(hash); // number
 * ```
 */
export async function fnv1a32(data: string | Uint8Array): Promise<number> {
  return hash32("fnv1a32", data);
}

/**
 * Compute FNV-1a 32-bit hash as hex string.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 8-character lowercase hex string
 *
 * @example
 * ```ts
 * import { fnv1a32Hex } from "@zig-wasm/hash";
 *
 * console.log(await fnv1a32Hex("test")); // "afd071e3"
 * ```
 */
export async function fnv1a32Hex(data: string | Uint8Array): Promise<string> {
  return toHex32(await fnv1a32(data));
}

// ============================================================================
// Sync API
// ============================================================================

/**
 * Synchronous version of {@link hash32}.
 *
 * Requires {@link init} to be called first. Throws {@link NotInitializedError}
 * if called before initialization.
 *
 * @param algorithm - The 32-bit hash algorithm to use
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional seed (only used by xxhash32)
 * @returns 32-bit hash value as number
 * @throws {NotInitializedError} If {@link init} has not been called
 *
 * @example
 * ```ts
 * import { init, hash32Sync } from "@zig-wasm/hash";
 *
 * await init();
 * const crc = hash32Sync("crc32", "data");
 * ```
 */
export function hash32Sync(algorithm: Hash32Algorithm, data: string | Uint8Array, seed?: number): number {
  const { exports, memory } = getSyncState();
  return hash32Impl(exports, memory, algorithm, toBytes(data), seed);
}

/**
 * Synchronous version of {@link hash64}.
 *
 * Requires {@link init} to be called first. Throws {@link NotInitializedError}
 * if called before initialization.
 *
 * @param algorithm - The 64-bit hash algorithm to use
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional seed (bigint, not used by fnv1a64)
 * @returns 64-bit hash value as bigint
 * @throws {NotInitializedError} If {@link init} has not been called
 *
 * @example
 * ```ts
 * import { init, hash64Sync } from "@zig-wasm/hash";
 *
 * await init();
 * const hash = hash64Sync("xxhash64", "data");
 * ```
 */
export function hash64Sync(algorithm: Hash64Algorithm, data: string | Uint8Array, seed?: bigint): bigint {
  const { exports, memory } = getSyncState();
  return hash64Impl(exports, memory, algorithm, toBytes(data), seed);
}

/**
 * Synchronous version of {@link hash}.
 *
 * @param algorithm - Any supported hash algorithm
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns Hash value (number for 32-bit, bigint for 64-bit)
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function hashSync(algorithm: HashAlgorithm, data: string | Uint8Array): number | bigint {
  if (is32BitAlgorithm(algorithm)) {
    return hash32Sync(algorithm, data);
  }
  return hash64Sync(algorithm, data);
}

/**
 * Synchronous version of {@link hashHex}.
 *
 * @param algorithm - Any supported hash algorithm
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns Hash as lowercase hex string (8 or 16 chars)
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function hashHexSync(algorithm: HashAlgorithm, data: string | Uint8Array): string {
  if (is32BitAlgorithm(algorithm)) {
    return toHex32(hash32Sync(algorithm, data));
  }
  return toHex64(hash64Sync(algorithm, data));
}

/**
 * Synchronous version of {@link crc32}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 32-bit CRC checksum as number
 * @throws {NotInitializedError} If {@link init} has not been called
 *
 * @example
 * ```ts
 * import { init, crc32Sync } from "@zig-wasm/hash";
 *
 * await init();
 * const crc = crc32Sync("Hello, World!");
 * ```
 */
export function crc32Sync(data: string | Uint8Array): number {
  return hash32Sync("crc32", data);
}

/**
 * Synchronous version of {@link crc32Hex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 8-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function crc32HexSync(data: string | Uint8Array): string {
  return toHex32(crc32Sync(data));
}

/**
 * Synchronous version of {@link adler32}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 32-bit Adler checksum as number
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function adler32Sync(data: string | Uint8Array): number {
  return hash32Sync("adler32", data);
}

/**
 * Synchronous version of {@link adler32Hex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 8-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function adler32HexSync(data: string | Uint8Array): string {
  return toHex32(adler32Sync(data));
}

/**
 * Synchronous version of {@link xxhash64}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 64-bit hash as bigint
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function xxhash64Sync(data: string | Uint8Array, seed?: bigint): bigint {
  return hash64Sync("xxhash64", data, seed);
}

/**
 * Synchronous version of {@link xxhash64Hex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 16-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function xxhash64HexSync(data: string | Uint8Array, seed?: bigint): string {
  return toHex64(xxhash64Sync(data, seed));
}

/**
 * Synchronous version of {@link xxhash32}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 32-bit seed (default: 0)
 * @returns 32-bit hash as number
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function xxhash32Sync(data: string | Uint8Array, seed?: number): number {
  return hash32Sync("xxhash32", data, seed);
}

/**
 * Synchronous version of {@link xxhash32Hex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 32-bit seed (default: 0)
 * @returns 8-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function xxhash32HexSync(data: string | Uint8Array, seed?: number): string {
  return toHex32(xxhash32Sync(data, seed));
}

/**
 * Synchronous version of {@link wyhash}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 64-bit hash as bigint
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function wyhashSync(data: string | Uint8Array, seed?: bigint): bigint {
  return hash64Sync("wyhash", data, seed);
}

/**
 * Synchronous version of {@link wyhashHex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 16-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function wyhashHexSync(data: string | Uint8Array, seed?: bigint): string {
  return toHex64(wyhashSync(data, seed));
}

/**
 * Synchronous version of {@link cityhash64}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 64-bit hash as bigint
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function cityhash64Sync(data: string | Uint8Array, seed?: bigint): bigint {
  return hash64Sync("cityhash64", data, seed);
}

/**
 * Synchronous version of {@link cityhash64Hex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 16-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function cityhash64HexSync(data: string | Uint8Array, seed?: bigint): string {
  return toHex64(cityhash64Sync(data, seed));
}

/**
 * Synchronous version of {@link murmur2_64}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 64-bit hash as bigint
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function murmur2_64Sync(data: string | Uint8Array, seed?: bigint): bigint {
  return hash64Sync("murmur2_64", data, seed);
}

/**
 * Synchronous version of {@link murmur2_64Hex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @param seed - Optional 64-bit seed (default: 0n)
 * @returns 16-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function murmur2_64HexSync(data: string | Uint8Array, seed?: bigint): string {
  return toHex64(murmur2_64Sync(data, seed));
}

/**
 * Synchronous version of {@link fnv1a64}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 64-bit hash as bigint
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function fnv1a64Sync(data: string | Uint8Array): bigint {
  return hash64Sync("fnv1a64", data);
}

/**
 * Synchronous version of {@link fnv1a64Hex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 16-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function fnv1a64HexSync(data: string | Uint8Array): string {
  return toHex64(fnv1a64Sync(data));
}

/**
 * Synchronous version of {@link fnv1a32}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 32-bit hash as number
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function fnv1a32Sync(data: string | Uint8Array): number {
  return hash32Sync("fnv1a32", data);
}

/**
 * Synchronous version of {@link fnv1a32Hex}.
 *
 * @param data - Input data as string (UTF-8) or Uint8Array
 * @returns 8-character lowercase hex string
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function fnv1a32HexSync(data: string | Uint8Array): string {
  return toHex32(fnv1a32Sync(data));
}
