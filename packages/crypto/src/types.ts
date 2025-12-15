/**
 * Type definitions for the @zig-wasm/crypto package.
 *
 * This module exports TypeScript types for hash algorithms, HMAC algorithms,
 * and the low-level WASM exports interface.
 *
 * @example Using HashAlgorithm type
 * ```ts
 * import type { HashAlgorithm } from "@zig-wasm/crypto";
 *
 * function hashData(algo: HashAlgorithm, data: string): Promise<Uint8Array> {
 *   return hash(algo, data);
 * }
 *
 * // Valid algorithms: "md5", "sha1", "sha256", "sha384", "sha512",
 * //                   "sha3-256", "sha3-512", "blake2b256", "blake2s256", "blake3"
 * ```
 *
 * @example Using HmacAlgorithm type
 * ```ts
 * import type { HmacAlgorithm } from "@zig-wasm/crypto";
 *
 * function createMac(algo: HmacAlgorithm, key: string, data: string): Promise<Uint8Array> {
 *   return hmac(algo, key, data);
 * }
 *
 * // Valid algorithms: "sha256", "sha512"
 * ```
 *
 * @module
 */

import type { WasmMemoryExports } from "@zig-wasm/core";

/**
 * Low-level WASM module exports for cryptographic operations.
 *
 * This interface defines all functions exported by the compiled Zig WASM module.
 * Most users should use the high-level {@link hash}, {@link hmac}, and algorithm-specific
 * functions instead of accessing these exports directly.
 *
 * @remarks
 * All hash functions follow the pattern:
 * - `{algorithm}_hash(dataPtr, dataLen, outPtr)` - compute hash
 * - `{algorithm}_digest_length()` - get output size in bytes
 *
 * HMAC functions take key and data pointers separately:
 * - `hmac_{algorithm}(keyPtr, keyLen, dataPtr, dataLen, outPtr)`
 * - `hmac_{algorithm}_length()` - get HMAC output size in bytes
 */
export interface CryptoWasmExports extends WasmMemoryExports {
  [key: string]: unknown;

  // ──────────────────────────────────────────────────────────────────────────
  // MD5 (128-bit / 16 bytes) - Legacy, not recommended for security
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Compute MD5 hash of input data.
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (16 bytes)
   */
  md5_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns MD5 digest length (16 bytes). */
  md5_digest_length: () => number;

  // ──────────────────────────────────────────────────────────────────────────
  // SHA-1 (160-bit / 20 bytes) - Legacy, not recommended for security
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Compute SHA-1 hash of input data.
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (20 bytes)
   */
  sha1_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns SHA-1 digest length (20 bytes). */
  sha1_digest_length: () => number;

  // ──────────────────────────────────────────────────────────────────────────
  // SHA-2 Family
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Compute SHA-256 hash of input data.
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (32 bytes)
   */
  sha256_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns SHA-256 digest length (32 bytes). */
  sha256_digest_length: () => number;

  /**
   * Compute SHA-384 hash of input data.
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (48 bytes)
   */
  sha384_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns SHA-384 digest length (48 bytes). */
  sha384_digest_length: () => number;

  /**
   * Compute SHA-512 hash of input data.
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (64 bytes)
   */
  sha512_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns SHA-512 digest length (64 bytes). */
  sha512_digest_length: () => number;

  // ──────────────────────────────────────────────────────────────────────────
  // SHA-3 Family (Keccak-based)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Compute SHA3-256 hash of input data.
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (32 bytes)
   */
  sha3_256_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns SHA3-256 digest length (32 bytes). */
  sha3_256_digest_length: () => number;

  /**
   * Compute SHA3-512 hash of input data.
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (64 bytes)
   */
  sha3_512_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns SHA3-512 digest length (64 bytes). */
  sha3_512_digest_length: () => number;

  // ──────────────────────────────────────────────────────────────────────────
  // BLAKE2 Family
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Compute BLAKE2b-256 hash of input data.
   *
   * BLAKE2b is optimized for 64-bit platforms.
   *
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (32 bytes)
   */
  blake2b256_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns BLAKE2b-256 digest length (32 bytes). */
  blake2b256_digest_length: () => number;

  /**
   * Compute BLAKE2s-256 hash of input data.
   *
   * BLAKE2s is optimized for 32-bit platforms and smaller messages.
   *
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (32 bytes)
   */
  blake2s256_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns BLAKE2s-256 digest length (32 bytes). */
  blake2s256_digest_length: () => number;

  // ──────────────────────────────────────────────────────────────────────────
  // BLAKE3
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Compute BLAKE3 hash of input data.
   *
   * BLAKE3 is the latest in the BLAKE family, offering excellent performance
   * and security. It supports parallelism and is suitable for all use cases.
   *
   * @param dataPtr - Pointer to input data in WASM memory
   * @param dataLen - Length of input data in bytes
   * @param outPtr - Pointer to output buffer (32 bytes)
   */
  blake3_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;

  /** Returns BLAKE3 digest length (32 bytes). */
  blake3_digest_length: () => number;

  // ──────────────────────────────────────────────────────────────────────────
  // HMAC (Hash-based Message Authentication Code)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Compute HMAC-SHA256 of input data with the given key.
   *
   * @param keyPtr - Pointer to secret key in WASM memory
   * @param keyLen - Length of secret key in bytes
   * @param dataPtr - Pointer to message data in WASM memory
   * @param dataLen - Length of message data in bytes
   * @param outPtr - Pointer to output buffer (32 bytes)
   */
  hmac_sha256: (
    keyPtr: number,
    keyLen: number,
    dataPtr: number,
    dataLen: number,
    outPtr: number,
  ) => void;

  /** Returns HMAC-SHA256 output length (32 bytes). */
  hmac_sha256_length: () => number;

  /**
   * Compute HMAC-SHA512 of input data with the given key.
   *
   * @param keyPtr - Pointer to secret key in WASM memory
   * @param keyLen - Length of secret key in bytes
   * @param dataPtr - Pointer to message data in WASM memory
   * @param dataLen - Length of message data in bytes
   * @param outPtr - Pointer to output buffer (64 bytes)
   */
  hmac_sha512: (
    keyPtr: number,
    keyLen: number,
    dataPtr: number,
    dataLen: number,
    outPtr: number,
  ) => void;

  /** Returns HMAC-SHA512 output length (64 bytes). */
  hmac_sha512_length: () => number;
}

/**
 * Supported cryptographic hash algorithms.
 *
 * Each algorithm has different characteristics:
 *
 * | Algorithm   | Output Size | Security | Performance | Notes |
 * |-------------|-------------|----------|-------------|-------|
 * | `md5`       | 128 bits    | Broken   | Fast        | Legacy only, avoid for security |
 * | `sha1`      | 160 bits    | Weak     | Fast        | Legacy only, avoid for security |
 * | `sha256`    | 256 bits    | Strong   | Good        | Most common choice |
 * | `sha384`    | 384 bits    | Strong   | Good        | Truncated SHA-512 |
 * | `sha512`    | 512 bits    | Strong   | Good        | Best for 64-bit systems |
 * | `sha3-256`  | 256 bits    | Strong   | Moderate    | Keccak-based, quantum-resistant |
 * | `sha3-512`  | 512 bits    | Strong   | Moderate    | Keccak-based, quantum-resistant |
 * | `blake2b256`| 256 bits    | Strong   | Very Fast   | Optimized for 64-bit |
 * | `blake2s256`| 256 bits    | Strong   | Very Fast   | Optimized for 32-bit |
 * | `blake3`    | 256 bits    | Strong   | Fastest     | Modern, parallelizable |
 *
 * @example
 * ```ts
 * import { hash, type HashAlgorithm } from "@zig-wasm/crypto";
 *
 * const algorithms: HashAlgorithm[] = ["sha256", "blake3", "sha3-256"];
 *
 * for (const algo of algorithms) {
 *   const digest = await hash(algo, "Hello, World!");
 *   console.log(`${algo}: ${digest.length} bytes`);
 * }
 * ```
 */
export type HashAlgorithm =
  | "md5"
  | "sha1"
  | "sha256"
  | "sha384"
  | "sha512"
  | "sha3-256"
  | "sha3-512"
  | "blake2b256"
  | "blake2s256"
  | "blake3";

/**
 * Supported HMAC (Hash-based Message Authentication Code) algorithms.
 *
 * HMAC provides both data integrity and authentication using a secret key.
 *
 * | Algorithm | Output Size | Use Case |
 * |-----------|-------------|----------|
 * | `sha256`  | 256 bits    | Most common, good for API authentication |
 * | `sha512`  | 512 bits    | Higher security margin |
 *
 * @example
 * ```ts
 * import { hmac, type HmacAlgorithm } from "@zig-wasm/crypto";
 *
 * const algo: HmacAlgorithm = "sha256";
 * const mac = await hmac(algo, "secret-key", "message to authenticate");
 * ```
 */
export type HmacAlgorithm = "sha256" | "sha512";
