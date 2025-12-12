/**
 * @zig-wasm/std
 *
 * Zig standard library for JavaScript via WebAssembly
 *
 * This is an umbrella package that re-exports all modules.
 * For smaller bundles, import specific packages directly:
 *
 * @example
 * ```ts
 * // Import everything
 * import * as std from '@zig-wasm/std';
 *
 * // Or import specific modules
 * import { sha256 } from '@zig-wasm/std/crypto';
 * import { crc32 } from '@zig-wasm/std/hash';
 *
 * // Or use individual packages
 * import { sha256 } from '@zig-wasm/crypto';
 * ```
 */

// Re-export core utilities
export {
  loadWasm,
  WasmMemory,
  AllocationScope,
  toHex,
  fromHex,
  concatBytes,
  compareBytes,
  getEnvironment,
} from "@zig-wasm/core";

// Re-export all modules as namespaces
export * as crypto from "@zig-wasm/crypto";
export * as hash from "@zig-wasm/hash";
export * as base64 from "@zig-wasm/base64";
export * as math from "@zig-wasm/math";
export * as compress from "@zig-wasm/compress";
