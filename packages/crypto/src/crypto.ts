/**
 * Crypto module - hash functions and HMAC
 *
 * Provides both async (lazy-loading) and sync (requires init) APIs.
 */

import type { AllocationScope as AllocationScopeType, InitOptions } from "@zig-wasm/core";
import { AllocationScope, getEnvironment, loadWasm, NotInitializedError, toHex, WasmMemory } from "@zig-wasm/core";
import type { CryptoWasmExports, HashAlgorithm, HmacAlgorithm } from "./types.ts";

// ============================================================================
// Module initialization
// ============================================================================

/** WASM module state */
let wasmExports: CryptoWasmExports | null = null;
let wasmMemory: WasmMemory | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the crypto module (idempotent, concurrency-safe)
 *
 * Call this once at app startup to enable sync API usage.
 * Not required for async API - it auto-initializes.
 *
 * @example
 * ```ts
 * import { init, sha256Sync } from "@zig-wasm/crypto";
 *
 * await init();
 * const hash = sha256Sync("hello");
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
    let result: Awaited<ReturnType<typeof loadWasm<CryptoWasmExports>>>;

    if (options?.wasmBytes) {
      result = await loadWasm<CryptoWasmExports>({ wasmBytes: options.wasmBytes, imports: options.imports });
    } else if (options?.wasmPath) {
      result = await loadWasm<CryptoWasmExports>({ wasmPath: options.wasmPath, imports: options.imports });
    } else if (options?.wasmUrl) {
      result = await loadWasm<CryptoWasmExports>({ wasmUrl: options.wasmUrl, imports: options.imports });
    } else if (env.isNode || env.isBun) {
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "../wasm/crypto.wasm");
      result = await loadWasm<CryptoWasmExports>({ wasmPath });
    } else {
      const wasmUrl = new URL("../wasm/crypto.wasm", import.meta.url);
      result = await loadWasm<CryptoWasmExports>({ wasmUrl: wasmUrl.href });
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

/** Internal: ensure initialized for async API */
async function ensureInit(): Promise<{ exports: CryptoWasmExports; memory: WasmMemory }> {
  await init();
  return { exports: wasmExports as CryptoWasmExports, memory: wasmMemory as WasmMemory };
}

/** Get exports for sync operations, throws if not initialized */
function getSyncState(): { exports: CryptoWasmExports; memory: WasmMemory } {
  if (!wasmExports || !wasmMemory) {
    throw new NotInitializedError("crypto");
  }
  return { exports: wasmExports, memory: wasmMemory };
}

// ============================================================================
// Utilities
// ============================================================================

/** Convert input to Uint8Array */
function toBytes(data: string | Uint8Array): Uint8Array {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data;
}

function getHashFunction(
  exports: CryptoWasmExports,
  algorithm: HashAlgorithm,
): (dataPtr: number, dataLen: number, outPtr: number) => void {
  switch (algorithm) {
    case "md5":
      return exports.md5_hash;
    case "sha1":
      return exports.sha1_hash;
    case "sha256":
      return exports.sha256_hash;
    case "sha384":
      return exports.sha384_hash;
    case "sha512":
      return exports.sha512_hash;
    case "sha3-256":
      return exports.sha3_256_hash;
    case "sha3-512":
      return exports.sha3_512_hash;
    case "blake2b256":
      return exports.blake2b256_hash;
    case "blake2s256":
      return exports.blake2s256_hash;
    case "blake3":
      return exports.blake3_hash;
  }
}

function getDigestLength(exports: CryptoWasmExports, algorithm: HashAlgorithm): number {
  switch (algorithm) {
    case "md5":
      return exports.md5_digest_length();
    case "sha1":
      return exports.sha1_digest_length();
    case "sha256":
      return exports.sha256_digest_length();
    case "sha384":
      return exports.sha384_digest_length();
    case "sha512":
      return exports.sha512_digest_length();
    case "sha3-256":
      return exports.sha3_256_digest_length();
    case "sha3-512":
      return exports.sha3_512_digest_length();
    case "blake2b256":
      return exports.blake2b256_digest_length();
    case "blake2s256":
      return exports.blake2s256_digest_length();
    case "blake3":
      return exports.blake3_digest_length();
  }
}

// ============================================================================
// Internal implementation (shared by sync/async)
// ============================================================================

function hashImpl(
  exports: CryptoWasmExports,
  mem: WasmMemory,
  algorithm: HashAlgorithm,
  data: Uint8Array,
): Uint8Array {
  const hashFn = getHashFunction(exports, algorithm);
  const digestLen = getDigestLength(exports, algorithm);

  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(digestLen);
    hashFn(input.ptr, input.len, outputPtr);
    return mem.copyOut(outputPtr, digestLen);
  });
}

function hmacImpl(
  exports: CryptoWasmExports,
  mem: WasmMemory,
  algorithm: HmacAlgorithm,
  key: Uint8Array,
  data: Uint8Array,
): Uint8Array {
  const hmacFn = algorithm === "sha256" ? exports.hmac_sha256 : exports.hmac_sha512;
  const outputLen = algorithm === "sha256" ? exports.hmac_sha256_length() : exports.hmac_sha512_length();

  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const keyInput = scope.allocAndCopy(key);
    const dataInput = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(outputLen);
    hmacFn(keyInput.ptr, keyInput.len, dataInput.ptr, dataInput.len, outputPtr);
    return mem.copyOut(outputPtr, outputLen);
  });
}

// ============================================================================
// Async API (auto-initializes)
// ============================================================================

/** Hash data with the specified algorithm */
export async function hash(algorithm: HashAlgorithm, data: string | Uint8Array): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return hashImpl(exports, memory, algorithm, toBytes(data));
}

/** Hash data and return as hex string */
export async function hashHex(algorithm: HashAlgorithm, data: string | Uint8Array): Promise<string> {
  return toHex(await hash(algorithm, data));
}

/** Hash with MD5 */
export async function md5(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("md5", data);
}

/** Hash with SHA1 */
export async function sha1(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha1", data);
}

/** Hash with SHA256 */
export async function sha256(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha256", data);
}

/** Hash with SHA384 */
export async function sha384(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha384", data);
}

/** Hash with SHA512 */
export async function sha512(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha512", data);
}

/** Hash with SHA3-256 */
export async function sha3_256(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha3-256", data);
}

/** Hash with SHA3-512 */
export async function sha3_512(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha3-512", data);
}

/** Hash with BLAKE2b-256 */
export async function blake2b256(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("blake2b256", data);
}

/** Hash with BLAKE2s-256 */
export async function blake2s256(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("blake2s256", data);
}

/** Hash with BLAKE3 */
export async function blake3(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("blake3", data);
}

/** Compute HMAC with the specified algorithm */
export async function hmac(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return hmacImpl(exports, memory, algorithm, toBytes(key), toBytes(data));
}

/** Compute HMAC and return as hex string */
export async function hmacHex(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): Promise<string> {
  return toHex(await hmac(algorithm, key, data));
}

/** Compute HMAC-SHA256 */
export async function hmacSha256(key: string | Uint8Array, data: string | Uint8Array): Promise<Uint8Array> {
  return hmac("sha256", key, data);
}

/** Compute HMAC-SHA512 */
export async function hmacSha512(key: string | Uint8Array, data: string | Uint8Array): Promise<Uint8Array> {
  return hmac("sha512", key, data);
}

/** Get digest length for a hash algorithm in bytes */
export async function getHashDigestLength(algorithm: HashAlgorithm): Promise<number> {
  const { exports } = await ensureInit();
  return getDigestLength(exports, algorithm);
}

// ============================================================================
// Sync API (requires init() first)
// ============================================================================

/** Hash data with the specified algorithm (sync) */
export function hashSync(algorithm: HashAlgorithm, data: string | Uint8Array): Uint8Array {
  const { exports, memory } = getSyncState();
  return hashImpl(exports, memory, algorithm, toBytes(data));
}

/** Hash data and return as hex string (sync) */
export function hashHexSync(algorithm: HashAlgorithm, data: string | Uint8Array): string {
  return toHex(hashSync(algorithm, data));
}

/** Hash with MD5 (sync) */
export function md5Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("md5", data);
}

/** Hash with SHA1 (sync) */
export function sha1Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha1", data);
}

/** Hash with SHA256 (sync) */
export function sha256Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha256", data);
}

/** Hash with SHA384 (sync) */
export function sha384Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha384", data);
}

/** Hash with SHA512 (sync) */
export function sha512Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha512", data);
}

/** Hash with SHA3-256 (sync) */
export function sha3_256Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha3-256", data);
}

/** Hash with SHA3-512 (sync) */
export function sha3_512Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha3-512", data);
}

/** Hash with BLAKE2b-256 (sync) */
export function blake2b256Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("blake2b256", data);
}

/** Hash with BLAKE2s-256 (sync) */
export function blake2s256Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("blake2s256", data);
}

/** Hash with BLAKE3 (sync) */
export function blake3Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("blake3", data);
}

/** Compute HMAC with the specified algorithm (sync) */
export function hmacSync(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): Uint8Array {
  const { exports, memory } = getSyncState();
  return hmacImpl(exports, memory, algorithm, toBytes(key), toBytes(data));
}

/** Compute HMAC and return as hex string (sync) */
export function hmacHexSync(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): string {
  return toHex(hmacSync(algorithm, key, data));
}

/** Compute HMAC-SHA256 (sync) */
export function hmacSha256Sync(key: string | Uint8Array, data: string | Uint8Array): Uint8Array {
  return hmacSync("sha256", key, data);
}

/** Compute HMAC-SHA512 (sync) */
export function hmacSha512Sync(key: string | Uint8Array, data: string | Uint8Array): Uint8Array {
  return hmacSync("sha512", key, data);
}

/** Get digest length for a hash algorithm in bytes (sync) */
export function getHashDigestLengthSync(algorithm: HashAlgorithm): number {
  const { exports } = getSyncState();
  return getDigestLength(exports, algorithm);
}
