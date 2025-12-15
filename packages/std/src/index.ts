/**
 * Zig standard library for JavaScript via WebAssembly.
 *
 * This umbrella package re-exports all zig-wasm modules, providing access to
 * high-performance WASM implementations of common algorithms. For smaller bundles,
 * import individual packages directly (e.g., {@link https://jsr.io/@zig-wasm/crypto | @zig-wasm/crypto}).
 *
 * ## Available Modules
 *
 * - {@link base64} - Base64 encoding/decoding (standard, URL-safe, with/without padding)
 * - {@link compress} - LZMA/XZ decompression
 * - {@link crypto} - Cryptographic hashes (SHA-256, SHA-512, MD5, BLAKE3, etc.) and HMAC
 * - {@link hash} - Non-cryptographic hashes (CRC32, xxHash, FNV, Murmur, etc.)
 * - {@link math} - Mathematical functions (trig, exp, log, rounding, bit operations)
 *
 * ## Import Styles
 *
 * This package supports three import patterns:
 *
 * 1. **Namespace import** - Access all modules via a single import
 * 2. **Subpath import** - Import specific modules via `@zig-wasm/std/<module>`
 * 3. **Individual packages** - Import from standalone packages (smallest bundle size)
 *
 * @example Namespace import - access all modules
 * ```ts
 * import * as std from "@zig-wasm/std";
 *
 * // Cryptographic hashing
 * const hash = await std.crypto.sha256("hello world");
 * console.log(hash); // "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
 *
 * // Non-cryptographic checksums
 * const checksum = await std.hash.crc32("data");
 *
 * // Base64 encoding
 * const encoded = await std.base64.encode("hello");
 * console.log(encoded); // "aGVsbG8="
 *
 * // Math operations
 * const result = std.math.sin(Math.PI / 2);
 * ```
 *
 * @example Subpath imports - import specific modules
 * ```ts
 * import { sha256, sha512 } from "@zig-wasm/std/crypto";
 * import { crc32, xxhash64 } from "@zig-wasm/std/hash";
 * import { encode, decode } from "@zig-wasm/std/base64";
 * import { sin, cos, sqrt } from "@zig-wasm/std/math";
 *
 * const hash = await sha256("hello");
 * const checksum = await crc32("data");
 * const encoded = await encode("hello");
 * ```
 *
 * @example Individual packages (recommended for smaller bundles)
 * ```ts
 * // Each package can be imported separately for minimal bundle size
 * import { sha256 } from "@zig-wasm/crypto";
 * import { crc32 } from "@zig-wasm/hash";
 * import { encode } from "@zig-wasm/base64";
 * import { sin } from "@zig-wasm/math";
 * ```
 *
 * @example Using core utilities
 * ```ts
 * import { toHex, fromHex, AllocationScope, getEnvironment } from "@zig-wasm/std";
 *
 * // Hex encoding utilities
 * const hex = toHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
 * console.log(hex); // "deadbeef"
 *
 * const bytes = fromHex("deadbeef");
 *
 * // Check runtime environment
 * const env = getEnvironment();
 * console.log(env.runtime); // "node", "bun", "deno", or "browser"
 * ```
 *
 * @module std
 */

// Re-export all modules as namespaces
export * as base64 from "@zig-wasm/base64";
export * as compress from "@zig-wasm/compress";

// Re-export core utilities
// dprint-ignore
export {
  AllocationScope, WasmMemory,
  compareBytes, concatBytes,
  fromHex, toHex,
  getEnvironment,
  loadWasm,
} from "@zig-wasm/core";
export * as crypto from "@zig-wasm/crypto";
export * as hash from "@zig-wasm/hash";
export * as math from "@zig-wasm/math";
