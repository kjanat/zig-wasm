import type { WasmLoadResult } from "@zig-wasm/core";
import { AllocationScope, getEnvironment, loadWasm, WasmMemory } from "@zig-wasm/core";
import type { Hash32Algorithm, Hash64Algorithm, HashAlgorithm, HashWasmExports } from "./types.js";

// Lazy-loaded module
let wasmModule: Promise<WasmLoadResult<HashWasmExports>> | null = null;
let memory: WasmMemory | null = null;

/** Get or load the WASM module */
async function getModule(): Promise<{
  exports: HashWasmExports;
  memory: WasmMemory;
}> {
  if (!wasmModule) {
    const env = getEnvironment();

    if (env.isNode || env.isBun) {
      // Node.js: load from file
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "hash.wasm");
      wasmModule = loadWasm<HashWasmExports>({ wasmPath });
    } else {
      // Browser: load from URL relative to module
      const wasmUrl = new URL("hash.wasm", import.meta.url);
      wasmModule = loadWasm<HashWasmExports>({ wasmUrl: wasmUrl.href });
    }
  }

  const result = await wasmModule;
  if (!memory) {
    memory = new WasmMemory(result.exports);
  }
  return { exports: result.exports, memory };
}

/** Convert input to Uint8Array */
function toBytes(data: string | Uint8Array): Uint8Array {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data;
}

/** Convert number to hex string */
function toHex32(n: number): string {
  return n.toString(16).padStart(8, "0");
}

/** Convert bigint to hex string */
function toHex64(n: bigint): string {
  return n.toString(16).padStart(16, "0");
}

// ============================================================================
// Generic hash functions
// ============================================================================

/** Hash data with a 32-bit algorithm */
export async function hash32(
  algorithm: Hash32Algorithm,
  data: string | Uint8Array,
  seed?: number,
): Promise<number> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(data);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);

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

/** Hash data with a 64-bit algorithm */
export async function hash64(
  algorithm: Hash64Algorithm,
  data: string | Uint8Array,
  seed?: bigint,
): Promise<bigint> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(data);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);

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

/** Hash data with any algorithm, returns number for 32-bit or bigint for 64-bit */
export async function hash(
  algorithm: HashAlgorithm,
  data: string | Uint8Array,
): Promise<number | bigint> {
  if (is32BitAlgorithm(algorithm)) {
    return hash32(algorithm, data);
  }
  return hash64(algorithm, data);
}

/** Hash data and return as hex string */
export async function hashHex(
  algorithm: HashAlgorithm,
  data: string | Uint8Array,
): Promise<string> {
  if (is32BitAlgorithm(algorithm)) {
    const result = await hash32(algorithm, data);
    return toHex32(result);
  }
  const result = await hash64(algorithm, data);
  return toHex64(result);
}

function is32BitAlgorithm(algorithm: HashAlgorithm): algorithm is Hash32Algorithm {
  return (
    algorithm === "crc32"
    || algorithm === "adler32"
    || algorithm === "xxhash32"
    || algorithm === "fnv1a32"
  );
}

// ============================================================================
// CRC32 & Adler32
// ============================================================================

/** Compute CRC32 checksum */
export async function crc32(data: string | Uint8Array): Promise<number> {
  return hash32("crc32", data);
}

/** Compute CRC32 checksum as hex string */
export async function crc32Hex(data: string | Uint8Array): Promise<string> {
  const result = await crc32(data);
  return toHex32(result);
}

/** Compute Adler32 checksum */
export async function adler32(data: string | Uint8Array): Promise<number> {
  return hash32("adler32", data);
}

/** Compute Adler32 checksum as hex string */
export async function adler32Hex(data: string | Uint8Array): Promise<string> {
  const result = await adler32(data);
  return toHex32(result);
}

// ============================================================================
// xxHash
// ============================================================================

/** Compute xxHash64 */
export async function xxhash64(
  data: string | Uint8Array,
  seed?: bigint,
): Promise<bigint> {
  return hash64("xxhash64", data, seed);
}

/** Compute xxHash64 as hex string */
export async function xxhash64Hex(
  data: string | Uint8Array,
  seed?: bigint,
): Promise<string> {
  const result = await xxhash64(data, seed);
  return toHex64(result);
}

/** Compute xxHash32 */
export async function xxhash32(
  data: string | Uint8Array,
  seed?: number,
): Promise<number> {
  return hash32("xxhash32", data, seed);
}

/** Compute xxHash32 as hex string */
export async function xxhash32Hex(
  data: string | Uint8Array,
  seed?: number,
): Promise<string> {
  const result = await xxhash32(data, seed);
  return toHex32(result);
}

// ============================================================================
// wyHash
// ============================================================================

/** Compute wyHash */
export async function wyhash(
  data: string | Uint8Array,
  seed?: bigint,
): Promise<bigint> {
  return hash64("wyhash", data, seed);
}

/** Compute wyHash as hex string */
export async function wyhashHex(
  data: string | Uint8Array,
  seed?: bigint,
): Promise<string> {
  const result = await wyhash(data, seed);
  return toHex64(result);
}

// ============================================================================
// CityHash
// ============================================================================

/** Compute CityHash64 */
export async function cityhash64(
  data: string | Uint8Array,
  seed?: bigint,
): Promise<bigint> {
  return hash64("cityhash64", data, seed);
}

/** Compute CityHash64 as hex string */
export async function cityhash64Hex(
  data: string | Uint8Array,
  seed?: bigint,
): Promise<string> {
  const result = await cityhash64(data, seed);
  return toHex64(result);
}

// ============================================================================
// MurmurHash
// ============================================================================

/** Compute MurmurHash2-64 */
export async function murmur2_64(
  data: string | Uint8Array,
  seed?: bigint,
): Promise<bigint> {
  return hash64("murmur2_64", data, seed);
}

/** Compute MurmurHash2-64 as hex string */
export async function murmur2_64Hex(
  data: string | Uint8Array,
  seed?: bigint,
): Promise<string> {
  const result = await murmur2_64(data, seed);
  return toHex64(result);
}

// ============================================================================
// FNV-1a
// ============================================================================

/** Compute FNV-1a 64-bit */
export async function fnv1a64(data: string | Uint8Array): Promise<bigint> {
  return hash64("fnv1a64", data);
}

/** Compute FNV-1a 64-bit as hex string */
export async function fnv1a64Hex(data: string | Uint8Array): Promise<string> {
  const result = await fnv1a64(data);
  return toHex64(result);
}

/** Compute FNV-1a 32-bit */
export async function fnv1a32(data: string | Uint8Array): Promise<number> {
  return hash32("fnv1a32", data);
}

/** Compute FNV-1a 32-bit as hex string */
export async function fnv1a32Hex(data: string | Uint8Array): Promise<string> {
  const result = await fnv1a32(data);
  return toHex32(result);
}
