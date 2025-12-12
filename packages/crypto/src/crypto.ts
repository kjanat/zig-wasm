import type { WasmLoadResult } from "@zig-wasm/core";
import { AllocationScope, getEnvironment, loadWasm, toHex, WasmMemory } from "@zig-wasm/core";
import type { CryptoWasmExports, HashAlgorithm, HmacAlgorithm } from "./types.ts";

// Lazy-loaded module
let wasmModule: Promise<WasmLoadResult<CryptoWasmExports>> | null = null;
let memory: WasmMemory | null = null;

/** Get or load the WASM module */
async function getModule(): Promise<{
  exports: CryptoWasmExports;
  memory: WasmMemory;
}> {
  if (!wasmModule) {
    const env = getEnvironment();

    if (env.isNode || env.isBun) {
      // Node.js: load from file
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "crypto.wasm");
      wasmModule = loadWasm<CryptoWasmExports>({ wasmPath });
    } else {
      // Browser: load from URL relative to module
      const wasmUrl = new URL("crypto.wasm", import.meta.url);
      wasmModule = loadWasm<CryptoWasmExports>({ wasmUrl: wasmUrl.href });
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

// ============================================================================
// Generic hash function
// ============================================================================

/** Hash data with the specified algorithm */
export async function hash(
  algorithm: HashAlgorithm,
  data: string | Uint8Array,
): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(data);

  // Get the hash function and digest length for the algorithm
  const hashFn = getHashFunction(exports, algorithm);
  const digestLen = getDigestLength(exports, algorithm);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(digestLen);

    hashFn(input.ptr, input.len, outputPtr);

    return mem.copyOut(outputPtr, digestLen);
  });
}

/** Hash data and return as hex string */
export async function hashHex(
  algorithm: HashAlgorithm,
  data: string | Uint8Array,
): Promise<string> {
  const result = await hash(algorithm, data);
  return toHex(result);
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

function getDigestLength(
  exports: CryptoWasmExports,
  algorithm: HashAlgorithm,
): number {
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
// Specific hash functions for convenience
// ============================================================================

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
export async function blake2b256(
  data: string | Uint8Array,
): Promise<Uint8Array> {
  return hash("blake2b256", data);
}

/** Hash with BLAKE2s-256 */
export async function blake2s256(
  data: string | Uint8Array,
): Promise<Uint8Array> {
  return hash("blake2s256", data);
}

/** Hash with BLAKE3 */
export async function blake3(data: string | Uint8Array): Promise<Uint8Array> {
  return hash("blake3", data);
}

// ============================================================================
// HMAC functions
// ============================================================================

/** Compute HMAC with the specified algorithm */
export async function hmac(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();
  const keyBytes = toBytes(key);
  const dataBytes = toBytes(data);

  const hmacFn = algorithm === "sha256" ? exports.hmac_sha256 : exports.hmac_sha512;
  const outputLen = algorithm === "sha256"
    ? exports.hmac_sha256_length()
    : exports.hmac_sha512_length();

  return AllocationScope.use(mem, (scope) => {
    const keyInput = scope.allocAndCopy(keyBytes);
    const dataInput = scope.allocAndCopy(dataBytes);
    const outputPtr = scope.alloc(outputLen);

    hmacFn(keyInput.ptr, keyInput.len, dataInput.ptr, dataInput.len, outputPtr);

    return mem.copyOut(outputPtr, outputLen);
  });
}

/** Compute HMAC and return as hex string */
export async function hmacHex(
  algorithm: HmacAlgorithm,
  key: string | Uint8Array,
  data: string | Uint8Array,
): Promise<string> {
  const result = await hmac(algorithm, key, data);
  return toHex(result);
}

/** Compute HMAC-SHA256 */
export async function hmacSha256(
  key: string | Uint8Array,
  data: string | Uint8Array,
): Promise<Uint8Array> {
  return hmac("sha256", key, data);
}

/** Compute HMAC-SHA512 */
export async function hmacSha512(
  key: string | Uint8Array,
  data: string | Uint8Array,
): Promise<Uint8Array> {
  return hmac("sha512", key, data);
}

// ============================================================================
// Digest length queries
// ============================================================================

/** Get digest length for a hash algorithm in bytes */
export async function getHashDigestLength(
  algorithm: HashAlgorithm,
): Promise<number> {
  const { exports } = await getModule();
  return getDigestLength(exports, algorithm);
}
