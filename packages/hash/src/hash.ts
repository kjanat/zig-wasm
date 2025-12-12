/**
 * Hash module - non-cryptographic hash functions
 *
 * Provides both async (lazy-loading) and sync (requires init) APIs.
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
 * Initialize the hash module (idempotent, concurrency-safe)
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
      const wasmPath = join(currentDir, "hash.wasm");
      result = await loadWasm<HashWasmExports>({ wasmPath });
    } else {
      const wasmUrl = new URL("hash.wasm", import.meta.url);
      result = await loadWasm<HashWasmExports>({ wasmUrl: wasmUrl.href });
    }

    wasmExports = result.exports;
    wasmMemory = new WasmMemory(result.exports);
  })();

  await initPromise;
}

/**
 * Check if the module is initialized
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

/** Hash data with a 32-bit algorithm */
export async function hash32(algorithm: Hash32Algorithm, data: string | Uint8Array, seed?: number): Promise<number> {
  const { exports, memory } = await ensureInit();
  return hash32Impl(exports, memory, algorithm, toBytes(data), seed);
}

/** Hash data with a 64-bit algorithm */
export async function hash64(algorithm: Hash64Algorithm, data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  const { exports, memory } = await ensureInit();
  return hash64Impl(exports, memory, algorithm, toBytes(data), seed);
}

/** Hash data with any algorithm */
export async function hash(algorithm: HashAlgorithm, data: string | Uint8Array): Promise<number | bigint> {
  if (is32BitAlgorithm(algorithm)) {
    return hash32(algorithm, data);
  }
  return hash64(algorithm, data);
}

/** Hash data and return as hex string */
export async function hashHex(algorithm: HashAlgorithm, data: string | Uint8Array): Promise<string> {
  if (is32BitAlgorithm(algorithm)) {
    return toHex32(await hash32(algorithm, data));
  }
  return toHex64(await hash64(algorithm, data));
}

export async function crc32(data: string | Uint8Array): Promise<number> {
  return hash32("crc32", data);
}

export async function crc32Hex(data: string | Uint8Array): Promise<string> {
  return toHex32(await crc32(data));
}

export async function adler32(data: string | Uint8Array): Promise<number> {
  return hash32("adler32", data);
}

export async function adler32Hex(data: string | Uint8Array): Promise<string> {
  return toHex32(await adler32(data));
}

export async function xxhash64(data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  return hash64("xxhash64", data, seed);
}

export async function xxhash64Hex(data: string | Uint8Array, seed?: bigint): Promise<string> {
  return toHex64(await xxhash64(data, seed));
}

export async function xxhash32(data: string | Uint8Array, seed?: number): Promise<number> {
  return hash32("xxhash32", data, seed);
}

export async function xxhash32Hex(data: string | Uint8Array, seed?: number): Promise<string> {
  return toHex32(await xxhash32(data, seed));
}

export async function wyhash(data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  return hash64("wyhash", data, seed);
}

export async function wyhashHex(data: string | Uint8Array, seed?: bigint): Promise<string> {
  return toHex64(await wyhash(data, seed));
}

export async function cityhash64(data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  return hash64("cityhash64", data, seed);
}

export async function cityhash64Hex(data: string | Uint8Array, seed?: bigint): Promise<string> {
  return toHex64(await cityhash64(data, seed));
}

export async function murmur2_64(data: string | Uint8Array, seed?: bigint): Promise<bigint> {
  return hash64("murmur2_64", data, seed);
}

export async function murmur2_64Hex(data: string | Uint8Array, seed?: bigint): Promise<string> {
  return toHex64(await murmur2_64(data, seed));
}

export async function fnv1a64(data: string | Uint8Array): Promise<bigint> {
  return hash64("fnv1a64", data);
}

export async function fnv1a64Hex(data: string | Uint8Array): Promise<string> {
  return toHex64(await fnv1a64(data));
}

export async function fnv1a32(data: string | Uint8Array): Promise<number> {
  return hash32("fnv1a32", data);
}

export async function fnv1a32Hex(data: string | Uint8Array): Promise<string> {
  return toHex32(await fnv1a32(data));
}

// ============================================================================
// Sync API
// ============================================================================

export function hash32Sync(algorithm: Hash32Algorithm, data: string | Uint8Array, seed?: number): number {
  const { exports, memory } = getSyncState();
  return hash32Impl(exports, memory, algorithm, toBytes(data), seed);
}

export function hash64Sync(algorithm: Hash64Algorithm, data: string | Uint8Array, seed?: bigint): bigint {
  const { exports, memory } = getSyncState();
  return hash64Impl(exports, memory, algorithm, toBytes(data), seed);
}

export function hashSync(algorithm: HashAlgorithm, data: string | Uint8Array): number | bigint {
  if (is32BitAlgorithm(algorithm)) {
    return hash32Sync(algorithm, data);
  }
  return hash64Sync(algorithm, data);
}

export function hashHexSync(algorithm: HashAlgorithm, data: string | Uint8Array): string {
  if (is32BitAlgorithm(algorithm)) {
    return toHex32(hash32Sync(algorithm, data));
  }
  return toHex64(hash64Sync(algorithm, data));
}

export function crc32Sync(data: string | Uint8Array): number {
  return hash32Sync("crc32", data);
}

export function crc32HexSync(data: string | Uint8Array): string {
  return toHex32(crc32Sync(data));
}

export function adler32Sync(data: string | Uint8Array): number {
  return hash32Sync("adler32", data);
}

export function adler32HexSync(data: string | Uint8Array): string {
  return toHex32(adler32Sync(data));
}

export function xxhash64Sync(data: string | Uint8Array, seed?: bigint): bigint {
  return hash64Sync("xxhash64", data, seed);
}

export function xxhash64HexSync(data: string | Uint8Array, seed?: bigint): string {
  return toHex64(xxhash64Sync(data, seed));
}

export function xxhash32Sync(data: string | Uint8Array, seed?: number): number {
  return hash32Sync("xxhash32", data, seed);
}

export function xxhash32HexSync(data: string | Uint8Array, seed?: number): string {
  return toHex32(xxhash32Sync(data, seed));
}

export function wyhashSync(data: string | Uint8Array, seed?: bigint): bigint {
  return hash64Sync("wyhash", data, seed);
}

export function wyhashHexSync(data: string | Uint8Array, seed?: bigint): string {
  return toHex64(wyhashSync(data, seed));
}

export function cityhash64Sync(data: string | Uint8Array, seed?: bigint): bigint {
  return hash64Sync("cityhash64", data, seed);
}

export function cityhash64HexSync(data: string | Uint8Array, seed?: bigint): string {
  return toHex64(cityhash64Sync(data, seed));
}

export function murmur2_64Sync(data: string | Uint8Array, seed?: bigint): bigint {
  return hash64Sync("murmur2_64", data, seed);
}

export function murmur2_64HexSync(data: string | Uint8Array, seed?: bigint): string {
  return toHex64(murmur2_64Sync(data, seed));
}

export function fnv1a64Sync(data: string | Uint8Array): bigint {
  return hash64Sync("fnv1a64", data);
}

export function fnv1a64HexSync(data: string | Uint8Array): string {
  return toHex64(fnv1a64Sync(data));
}

export function fnv1a32Sync(data: string | Uint8Array): number {
  return hash32Sync("fnv1a32", data);
}

export function fnv1a32HexSync(data: string | Uint8Array): string {
  return toHex32(fnv1a32Sync(data));
}
