import type { WasmMemoryExports } from "@zig-wasm/core";

/** Hash WASM module exports */
export interface HashWasmExports extends WasmMemoryExports {
  [key: string]: unknown;
  // CRC32
  crc32: (dataPtr: number, dataLen: number) => number;

  // Adler32
  adler32: (dataPtr: number, dataLen: number) => number;

  // xxHash64
  xxhash64: (dataPtr: number, dataLen: number) => bigint;
  xxhash64_seeded: (seed: bigint, dataPtr: number, dataLen: number) => bigint;

  // xxHash32
  xxhash32: (dataPtr: number, dataLen: number) => number;
  xxhash32_seeded: (seed: number, dataPtr: number, dataLen: number) => number;

  // wyHash
  wyhash: (dataPtr: number, dataLen: number) => bigint;
  wyhash_seeded: (seed: bigint, dataPtr: number, dataLen: number) => bigint;

  // CityHash64
  cityhash64: (dataPtr: number, dataLen: number) => bigint;
  cityhash64_seeded: (seed: bigint, dataPtr: number, dataLen: number) => bigint;

  // Murmur2-64
  murmur2_64: (dataPtr: number, dataLen: number) => bigint;
  murmur2_64_seeded: (seed: bigint, dataPtr: number, dataLen: number) => bigint;

  // FNV-1a 64-bit
  fnv1a_64: (dataPtr: number, dataLen: number) => bigint;

  // FNV-1a 32-bit
  fnv1a_32: (dataPtr: number, dataLen: number) => number;
}

/** 32-bit hash algorithm names */
export type Hash32Algorithm = "crc32" | "adler32" | "xxhash32" | "fnv1a32";

/** 64-bit hash algorithm names */
export type Hash64Algorithm =
  | "xxhash64"
  | "wyhash"
  | "cityhash64"
  | "murmur2_64"
  | "fnv1a64";

/** All hash algorithm names */
export type HashAlgorithm = Hash32Algorithm | Hash64Algorithm;
