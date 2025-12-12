import type { WasmMemoryExports } from "@zig-wasm/core";

/** Crypto WASM module exports */
export interface CryptoWasmExports extends WasmMemoryExports {
  [key: string]: unknown;
  // MD5
  md5_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  md5_digest_length: () => number;

  // SHA1
  sha1_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  sha1_digest_length: () => number;

  // SHA256
  sha256_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  sha256_digest_length: () => number;

  // SHA384
  sha384_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  sha384_digest_length: () => number;

  // SHA512
  sha512_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  sha512_digest_length: () => number;

  // SHA3-256
  sha3_256_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  sha3_256_digest_length: () => number;

  // SHA3-512
  sha3_512_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  sha3_512_digest_length: () => number;

  // BLAKE2b-256
  blake2b256_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  blake2b256_digest_length: () => number;

  // BLAKE2s-256
  blake2s256_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  blake2s256_digest_length: () => number;

  // BLAKE3
  blake3_hash: (dataPtr: number, dataLen: number, outPtr: number) => void;
  blake3_digest_length: () => number;

  // HMAC
  hmac_sha256: (
    keyPtr: number,
    keyLen: number,
    dataPtr: number,
    dataLen: number,
    outPtr: number,
  ) => void;
  hmac_sha256_length: () => number;

  hmac_sha512: (
    keyPtr: number,
    keyLen: number,
    dataPtr: number,
    dataLen: number,
    outPtr: number,
  ) => void;
  hmac_sha512_length: () => number;
}

/** Hash algorithm names */
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

/** HMAC algorithm names */
export type HmacAlgorithm = "sha256" | "sha512";
