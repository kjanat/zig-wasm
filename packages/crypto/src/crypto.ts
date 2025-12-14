/**
 * Cryptographic hash functions and HMAC implementation.
 *
 * This module provides the core implementation for all hash and HMAC operations.
 * It supports both async (auto-initializing) and sync (requires {@link init}) APIs.
 *
 * ## Supported Hash Algorithms
 *
 * - **MD5** - 128-bit, legacy (not secure)
 * - **SHA-1** - 160-bit, legacy (not secure)
 * - **SHA-2** - SHA-256, SHA-384, SHA-512 (recommended)
 * - **SHA-3** - SHA3-256, SHA3-512 (Keccak-based)
 * - **BLAKE2** - BLAKE2b-256, BLAKE2s-256 (fast and secure)
 * - **BLAKE3** - 256-bit (fastest, modern)
 *
 * ## Supported HMAC Algorithms
 *
 * - **HMAC-SHA256** - 256-bit output
 * - **HMAC-SHA512** - 512-bit output
 *
 * @example Basic hashing
 * ```ts
 * import { sha256, blake3, hashHex } from "@zig-wasm/crypto";
 *
 * // Using algorithm-specific functions
 * const hash = await sha256("Hello, World!");
 * console.log(hash); // Uint8Array(32)
 *
 * // Using generic hash function with hex output
 * const hex = await hashHex("blake3", "Hello, World!");
 * console.log(hex); // "ede5c0b10f2ec4979c69b52f61e42ff5b413519ce09be0f14d098dcfe5f6f98d"
 * ```
 *
 * @example HMAC authentication
 * ```ts
 * import { hmacSha256, hmacHex } from "@zig-wasm/crypto";
 *
 * // Generate HMAC for API authentication
 * const signature = await hmacSha256("secret-key", "request-body");
 *
 * // Get HMAC as hex string
 * const signatureHex = await hmacHex("sha256", "secret-key", "request-body");
 * ```
 *
 * @example Sync API usage
 * ```ts
 * import { init, sha256Sync, hmacSha256Sync } from "@zig-wasm/crypto";
 *
 * // Must initialize first for sync API
 * await init();
 *
 * // Now sync functions work without await
 * const hash = sha256Sync("Hello");
 * const mac = hmacSha256Sync("key", "data");
 * ```
 *
 * @module crypto
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
 * Initialize the crypto WASM module.
 *
 * This function is idempotent and concurrency-safe. Multiple calls will
 * return the same initialization promise.
 *
 * **When to call:**
 * - Required before using any sync API functions (e.g., {@link sha256Sync})
 * - Not required for async API - it auto-initializes
 *
 * **Loading priority:**
 * 1. `wasmBytes` - Use provided ArrayBuffer directly
 * 2. `wasmPath` - Load from filesystem path (Node.js/Bun)
 * 3. `wasmUrl` - Fetch from URL (browsers)
 * 4. Auto-detect - Uses filesystem in Node.js/Bun, URL in browsers
 *
 * @param options - Optional configuration for WASM loading
 * @returns Promise that resolves when initialization is complete
 *
 * @example Basic initialization
 * ```ts
 * import { init, sha256Sync } from "@zig-wasm/crypto";
 *
 * await init();
 * const hash = sha256Sync("hello");
 * ```
 *
 * @example Custom WASM path
 * ```ts
 * import { init } from "@zig-wasm/crypto";
 *
 * await init({ wasmPath: "/custom/path/to/crypto.wasm" });
 * ```
 *
 * @example Pre-loaded WASM bytes
 * ```ts
 * import { init } from "@zig-wasm/crypto";
 *
 * const wasmBytes = await fetch("/crypto.wasm").then(r => r.arrayBuffer());
 * await init({ wasmBytes });
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
 * Check if the crypto module has been initialized.
 *
 * @returns `true` if {@link init} has completed successfully, `false` otherwise
 *
 * @example
 * ```ts
 * import { isInitialized, init, sha256Sync } from "@zig-wasm/crypto";
 *
 * if (!isInitialized()) {
 *   await init();
 * }
 * const hash = sha256Sync("hello");
 * ```
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

/**
 * Compute a cryptographic hash of the input data.
 *
 * This is the generic hash function that accepts any supported algorithm.
 * For convenience, algorithm-specific functions like {@link sha256} are also available.
 *
 * @param algorithm - The hash algorithm to use (see {@link HashAlgorithm})
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to the hash digest as Uint8Array
 *
 * @example
 * ```ts
 * import { hash } from "@zig-wasm/crypto";
 *
 * // Hash with different algorithms
 * const sha256Hash = await hash("sha256", "Hello");
 * const blake3Hash = await hash("blake3", "Hello");
 *
 * // Hash binary data
 * const binaryData = new Uint8Array([1, 2, 3, 4]);
 * const binaryHash = await hash("sha512", binaryData);
 * ```
 */
export async function hash(algorithm: HashAlgorithm, data: string | Uint8Array): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return hashImpl(exports, memory, algorithm, toBytes(data));
}

/**
 * Compute a cryptographic hash and return it as a hexadecimal string.
 *
 * @param algorithm - The hash algorithm to use (see {@link HashAlgorithm})
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to the hash digest as lowercase hex string
 *
 * @example
 * ```ts
 * import { hashHex } from "@zig-wasm/crypto";
 *
 * const hex = await hashHex("sha256", "Hello, World!");
 * console.log(hex); // "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f"
 * ```
 */
export async function hashHex(algorithm: HashAlgorithm, data: string | Uint8Array): Promise<string> {
  return toHex(await hash(algorithm, data));
}

/**
 * Compute MD5 hash of the input data.
 *
 * **Warning:** MD5 is cryptographically broken. Use only for legacy compatibility
 * or non-security purposes (e.g., checksums).
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 16-byte (128-bit) hash digest
 *
 * @example
 * ```ts
 * import { md5 } from "@zig-wasm/crypto";
 *
 * const hash = await md5("Hello");
 * console.log(hash.length); // 16
 * ```
 */
export async function md5(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("md5", data);
}

/**
 * Compute SHA-1 hash of the input data.
 *
 * **Warning:** SHA-1 is cryptographically weak. Use SHA-256 or better for security.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 20-byte (160-bit) hash digest
 *
 * @example
 * ```ts
 * import { sha1 } from "@zig-wasm/crypto";
 *
 * const hash = await sha1("Hello");
 * console.log(hash.length); // 20
 * ```
 */
export async function sha1(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha1", data);
}

/**
 * Compute SHA-256 hash of the input data.
 *
 * SHA-256 is part of the SHA-2 family and is the most widely used secure hash function.
 * Recommended for most cryptographic applications.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 32-byte (256-bit) hash digest
 *
 * @example
 * ```ts
 * import { sha256 } from "@zig-wasm/crypto";
 *
 * const hash = await sha256("Hello, World!");
 * console.log(hash.length); // 32
 * ```
 */
export async function sha256(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha256", data);
}

/**
 * Compute SHA-384 hash of the input data.
 *
 * SHA-384 is a truncated version of SHA-512, providing 384 bits of security.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 48-byte (384-bit) hash digest
 *
 * @example
 * ```ts
 * import { sha384 } from "@zig-wasm/crypto";
 *
 * const hash = await sha384("Hello");
 * console.log(hash.length); // 48
 * ```
 */
export async function sha384(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha384", data);
}

/**
 * Compute SHA-512 hash of the input data.
 *
 * SHA-512 provides the highest security margin in the SHA-2 family.
 * Performs better than SHA-256 on 64-bit systems.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 64-byte (512-bit) hash digest
 *
 * @example
 * ```ts
 * import { sha512 } from "@zig-wasm/crypto";
 *
 * const hash = await sha512("Hello");
 * console.log(hash.length); // 64
 * ```
 */
export async function sha512(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha512", data);
}

/**
 * Compute SHA3-256 hash of the input data.
 *
 * SHA-3 is based on the Keccak algorithm and provides an alternative to SHA-2.
 * Considered quantum-resistant and suitable for long-term security.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 32-byte (256-bit) hash digest
 *
 * @example
 * ```ts
 * import { sha3_256 } from "@zig-wasm/crypto";
 *
 * const hash = await sha3_256("Hello");
 * console.log(hash.length); // 32
 * ```
 */
export async function sha3_256(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha3-256", data);
}

/**
 * Compute SHA3-512 hash of the input data.
 *
 * SHA3-512 provides the maximum security level in the SHA-3 family.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 64-byte (512-bit) hash digest
 *
 * @example
 * ```ts
 * import { sha3_512 } from "@zig-wasm/crypto";
 *
 * const hash = await sha3_512("Hello");
 * console.log(hash.length); // 64
 * ```
 */
export async function sha3_512(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("sha3-512", data);
}

/**
 * Compute BLAKE2b-256 hash of the input data.
 *
 * BLAKE2b is optimized for 64-bit platforms and is faster than SHA-2/SHA-3
 * while maintaining strong security. The 256-bit variant is suitable for
 * most applications.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 32-byte (256-bit) hash digest
 *
 * @example
 * ```ts
 * import { blake2b256 } from "@zig-wasm/crypto";
 *
 * const hash = await blake2b256("Hello");
 * console.log(hash.length); // 32
 * ```
 */
export async function blake2b256(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("blake2b256", data);
}

/**
 * Compute BLAKE2s-256 hash of the input data.
 *
 * BLAKE2s is optimized for 32-bit platforms and smaller messages.
 * Provides the same security as BLAKE2b but with different performance
 * characteristics.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 32-byte (256-bit) hash digest
 *
 * @example
 * ```ts
 * import { blake2s256 } from "@zig-wasm/crypto";
 *
 * const hash = await blake2s256("Hello");
 * console.log(hash.length); // 32
 * ```
 */
export async function blake2s256(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("blake2s256", data);
}

/**
 * Compute BLAKE3 hash of the input data.
 *
 * BLAKE3 is the fastest cryptographic hash function available, while
 * maintaining strong security. It supports:
 * - Parallelization for large inputs
 * - Incremental hashing
 * - Keyed hashing (MAC)
 * - Key derivation
 *
 * Recommended as the default choice for new applications.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 32-byte (256-bit) hash digest
 *
 * @example
 * ```ts
 * import { blake3 } from "@zig-wasm/crypto";
 *
 * const hash = await blake3("Hello, World!");
 * console.log(hash.length); // 32
 * ```
 */
export async function blake3(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("blake3", data);
}

/**
 * Compute HMAC (Hash-based Message Authentication Code) of the input data.
 *
 * HMAC combines a secret key with a hash function to provide both
 * data integrity and authentication.
 *
 * @param algorithm - The underlying hash algorithm ("sha256" or "sha512")
 * @param key - Secret key as string (UTF-8 encoded) or Uint8Array
 * @param data - Message data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to the HMAC as Uint8Array
 *
 * @example
 * ```ts
 * import { hmac } from "@zig-wasm/crypto";
 *
 * // API request signing
 * const signature = await hmac("sha256", "api-secret-key", "POST /api/data");
 *
 * // Message authentication
 * const mac = await hmac("sha512", secretKey, messageBody);
 * ```
 */
export async function hmac(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return hmacImpl(exports, memory, algorithm, toBytes(key), toBytes(data));
}

/**
 * Compute HMAC and return it as a hexadecimal string.
 *
 * @param algorithm - The underlying hash algorithm ("sha256" or "sha512")
 * @param key - Secret key as string (UTF-8 encoded) or Uint8Array
 * @param data - Message data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to the HMAC as lowercase hex string
 *
 * @example
 * ```ts
 * import { hmacHex } from "@zig-wasm/crypto";
 *
 * const signature = await hmacHex("sha256", "secret", "message");
 * console.log(signature); // "aa747c502a898200f9e4fa21bac68136..."
 * ```
 */
export async function hmacHex(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): Promise<string> {
  return toHex(await hmac(algorithm, key, data));
}

/**
 * Compute HMAC-SHA256 of the input data.
 *
 * Convenience function equivalent to `hmac("sha256", key, data)`.
 * HMAC-SHA256 is the most common choice for API authentication.
 *
 * @param key - Secret key as string (UTF-8 encoded) or Uint8Array
 * @param data - Message data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 32-byte (256-bit) HMAC
 *
 * @example
 * ```ts
 * import { hmacSha256 } from "@zig-wasm/crypto";
 *
 * // Generate signature for webhook verification
 * const signature = await hmacSha256(webhookSecret, requestBody);
 * ```
 */
export async function hmacSha256(key: string | Uint8Array, data: string | Uint8Array): Promise<Uint8Array> {
  return hmac("sha256", key, data);
}

/**
 * Compute HMAC-SHA512 of the input data.
 *
 * Convenience function equivalent to `hmac("sha512", key, data)`.
 * HMAC-SHA512 provides a higher security margin than HMAC-SHA256.
 *
 * @param key - Secret key as string (UTF-8 encoded) or Uint8Array
 * @param data - Message data as string (UTF-8 encoded) or Uint8Array
 * @returns Promise resolving to 64-byte (512-bit) HMAC
 *
 * @example
 * ```ts
 * import { hmacSha512 } from "@zig-wasm/crypto";
 *
 * const mac = await hmacSha512("secret-key", "important message");
 * console.log(mac.length); // 64
 * ```
 */
export async function hmacSha512(key: string | Uint8Array, data: string | Uint8Array): Promise<Uint8Array> {
  return hmac("sha512", key, data);
}

/**
 * Get the digest length in bytes for a hash algorithm.
 *
 * @param algorithm - The hash algorithm to query
 * @returns Promise resolving to the digest length in bytes
 *
 * @example
 * ```ts
 * import { getHashDigestLength } from "@zig-wasm/crypto";
 *
 * const sha256Len = await getHashDigestLength("sha256"); // 32
 * const sha512Len = await getHashDigestLength("sha512"); // 64
 * const blake3Len = await getHashDigestLength("blake3"); // 32
 * ```
 */
export async function getHashDigestLength(algorithm: HashAlgorithm): Promise<number> {
  const { exports } = await ensureInit();
  return getDigestLength(exports, algorithm);
}

// ============================================================================
// Sync API (requires init() first)
// ============================================================================

/**
 * Compute a cryptographic hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param algorithm - The hash algorithm to use (see {@link HashAlgorithm})
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns The hash digest as Uint8Array
 * @throws {@link NotInitializedError} if {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, hashSync } from "@zig-wasm/crypto";
 *
 * await init();
 * const hash = hashSync("sha256", "Hello");
 * ```
 */
export function hashSync(algorithm: HashAlgorithm, data: string | Uint8Array): Uint8Array {
  const { exports, memory } = getSyncState();
  return hashImpl(exports, memory, algorithm, toBytes(data));
}

/**
 * Compute a cryptographic hash and return it as a hexadecimal string (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param algorithm - The hash algorithm to use (see {@link HashAlgorithm})
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns The hash digest as lowercase hex string
 * @throws {@link NotInitializedError} if {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, hashHexSync } from "@zig-wasm/crypto";
 *
 * await init();
 * const hex = hashHexSync("sha256", "Hello");
 * ```
 */
export function hashHexSync(algorithm: HashAlgorithm, data: string | Uint8Array): string {
  return toHex(hashSync(algorithm, data));
}

/**
 * Compute MD5 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 16-byte (128-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function md5Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("md5", data);
}

/**
 * Compute SHA-1 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 20-byte (160-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function sha1Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha1", data);
}

/**
 * Compute SHA-256 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 32-byte (256-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, sha256Sync } from "@zig-wasm/crypto";
 *
 * await init();
 * const hash = sha256Sync("Hello, World!");
 * ```
 */
export function sha256Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha256", data);
}

/**
 * Compute SHA-384 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 48-byte (384-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function sha384Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha384", data);
}

/**
 * Compute SHA-512 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 64-byte (512-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function sha512Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha512", data);
}

/**
 * Compute SHA3-256 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 32-byte (256-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function sha3_256Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha3-256", data);
}

/**
 * Compute SHA3-512 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 64-byte (512-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function sha3_512Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("sha3-512", data);
}

/**
 * Compute BLAKE2b-256 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 32-byte (256-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function blake2b256Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("blake2b256", data);
}

/**
 * Compute BLAKE2s-256 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 32-byte (256-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function blake2s256Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("blake2s256", data);
}

/**
 * Compute BLAKE3 hash of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param data - Input data as string (UTF-8 encoded) or Uint8Array
 * @returns 32-byte (256-bit) hash digest
 * @throws {@link NotInitializedError} if {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, blake3Sync } from "@zig-wasm/crypto";
 *
 * await init();
 * const hash = blake3Sync("Hello, World!");
 * ```
 */
export function blake3Sync(data: string | Uint8Array): Uint8Array {
  return hashSync("blake3", data);
}

/**
 * Compute HMAC with the specified algorithm (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param algorithm - The underlying hash algorithm ("sha256" or "sha512")
 * @param key - Secret key as string (UTF-8 encoded) or Uint8Array
 * @param data - Message data as string (UTF-8 encoded) or Uint8Array
 * @returns The HMAC as Uint8Array
 * @throws {@link NotInitializedError} if {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, hmacSync } from "@zig-wasm/crypto";
 *
 * await init();
 * const mac = hmacSync("sha256", "secret", "message");
 * ```
 */
export function hmacSync(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): Uint8Array {
  const { exports, memory } = getSyncState();
  return hmacImpl(exports, memory, algorithm, toBytes(key), toBytes(data));
}

/**
 * Compute HMAC and return it as a hexadecimal string (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param algorithm - The underlying hash algorithm ("sha256" or "sha512")
 * @param key - Secret key as string (UTF-8 encoded) or Uint8Array
 * @param data - Message data as string (UTF-8 encoded) or Uint8Array
 * @returns The HMAC as lowercase hex string
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function hmacHexSync(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): string {
  return toHex(hmacSync(algorithm, key, data));
}

/**
 * Compute HMAC-SHA256 of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param key - Secret key as string (UTF-8 encoded) or Uint8Array
 * @param data - Message data as string (UTF-8 encoded) or Uint8Array
 * @returns 32-byte (256-bit) HMAC
 * @throws {@link NotInitializedError} if {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, hmacSha256Sync } from "@zig-wasm/crypto";
 *
 * await init();
 * const signature = hmacSha256Sync("secret-key", "data");
 * ```
 */
export function hmacSha256Sync(key: string | Uint8Array, data: string | Uint8Array): Uint8Array {
  return hmacSync("sha256", key, data);
}

/**
 * Compute HMAC-SHA512 of the input data (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param key - Secret key as string (UTF-8 encoded) or Uint8Array
 * @param data - Message data as string (UTF-8 encoded) or Uint8Array
 * @returns 64-byte (512-bit) HMAC
 * @throws {@link NotInitializedError} if {@link init} was not called
 */
export function hmacSha512Sync(key: string | Uint8Array, data: string | Uint8Array): Uint8Array {
  return hmacSync("sha512", key, data);
}

/**
 * Get the digest length in bytes for a hash algorithm (synchronous).
 *
 * **Requires:** {@link init} must be called first.
 *
 * @param algorithm - The hash algorithm to query
 * @returns The digest length in bytes
 * @throws {@link NotInitializedError} if {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, getHashDigestLengthSync } from "@zig-wasm/crypto";
 *
 * await init();
 * const len = getHashDigestLengthSync("sha256"); // 32
 * ```
 */
export function getHashDigestLengthSync(algorithm: HashAlgorithm): number {
  const { exports } = getSyncState();
  return getDigestLength(exports, algorithm);
}
