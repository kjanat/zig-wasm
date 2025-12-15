/**
 * Utility functions for byte and string manipulation.
 *
 * This module provides common operations for working with binary data:
 *
 * - **Hex encoding/decoding**: {@link toHex} and {@link fromHex}
 * - **Byte array operations**: {@link concatBytes} and {@link compareBytes}
 * - **String conversion**: {@link stringToBytes} and {@link bytesToString}
 *
 * These utilities are used internally by `@zig-wasm` packages but are also
 * exported for general use when working with WASM modules.
 *
 * @example Hex encoding and decoding
 * ```ts
 * import { toHex, fromHex } from "@zig-wasm/core";
 *
 * const bytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
 * const hex = toHex(bytes); // "deadbeef"
 *
 * const decoded = fromHex("cafebabe");
 * console.log(decoded); // Uint8Array [0xca, 0xfe, 0xba, 0xbe]
 * ```
 *
 * @example Concatenating byte arrays
 * ```ts
 * import { concatBytes } from "@zig-wasm/core";
 *
 * const header = new Uint8Array([0x01, 0x02]);
 * const body = new Uint8Array([0x03, 0x04, 0x05]);
 * const footer = new Uint8Array([0x06]);
 *
 * const combined = concatBytes(header, body, footer);
 * // Uint8Array [0x01, 0x02, 0x03, 0x04, 0x05, 0x06]
 * ```
 *
 * @example String to bytes conversion
 * ```ts
 * import { stringToBytes, bytesToString } from "@zig-wasm/core";
 *
 * const bytes = stringToBytes("Hello, World!");
 * const str = bytesToString(bytes);
 * console.log(str); // "Hello, World!"
 * ```
 *
 * @module utils
 */

/**
 * Convert a byte array to a lowercase hexadecimal string.
 *
 * @param bytes - The bytes to encode
 * @returns A lowercase hex string (2 characters per byte)
 *
 * @example
 * ```ts
 * import { toHex } from "@zig-wasm/core";
 *
 * const hash = new Uint8Array([0x2c, 0xf2, 0x4d, 0xba]);
 * console.log(toHex(hash)); // "2cf24dba"
 * ```
 */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert a hexadecimal string to a byte array.
 *
 * @param hex - The hex string to decode (case-insensitive, must have even length)
 * @returns The decoded bytes
 * @throws Error if the hex string has odd length or contains invalid characters
 *
 * @example
 * ```ts
 * import { fromHex } from "@zig-wasm/core";
 *
 * const bytes = fromHex("deadbeef");
 * console.log(bytes); // Uint8Array [0xde, 0xad, 0xbe, 0xef]
 *
 * // Case insensitive
 * const bytes2 = fromHex("DEADBEEF");
 * console.log(bytes2); // Uint8Array [0xde, 0xad, 0xbe, 0xef]
 * ```
 */
export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Hex string must have even length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const pair = hex.slice(i * 2, i * 2 + 2);
    if (!/^[0-9a-fA-F]{2}$/.test(pair)) {
      throw new Error(`Invalid hex character at position ${i * 2}`);
    }
    bytes[i] = parseInt(pair, 16);
  }
  return bytes;
}

/**
 * Concatenate multiple byte arrays into a single array.
 *
 * @param arrays - The byte arrays to concatenate
 * @returns A new Uint8Array containing all input bytes in order
 *
 * @example
 * ```ts
 * import { concatBytes } from "@zig-wasm/core";
 *
 * const part1 = new Uint8Array([1, 2, 3]);
 * const part2 = new Uint8Array([4, 5]);
 * const combined = concatBytes(part1, part2);
 * console.log(combined); // Uint8Array [1, 2, 3, 4, 5]
 * ```
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Compare two byte arrays for equality.
 *
 * Performs a constant-time comparison suitable for comparing
 * cryptographic hashes (though timing attacks are less relevant
 * in JavaScript due to JIT variability).
 *
 * @param a - First byte array
 * @param b - Second byte array
 * @returns True if arrays have identical contents
 *
 * @example
 * ```ts
 * import { compareBytes } from "@zig-wasm/core";
 *
 * const hash1 = new Uint8Array([1, 2, 3]);
 * const hash2 = new Uint8Array([1, 2, 3]);
 * const hash3 = new Uint8Array([1, 2, 4]);
 *
 * console.log(compareBytes(hash1, hash2)); // true
 * console.log(compareBytes(hash1, hash3)); // false
 * ```
 */
export function compareBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Convert a string to UTF-8 encoded bytes.
 *
 * @param str - The string to encode
 * @returns UTF-8 encoded bytes
 *
 * @example
 * ```ts
 * import { stringToBytes } from "@zig-wasm/core";
 *
 * const bytes = stringToBytes("Hello");
 * console.log(bytes); // Uint8Array [72, 101, 108, 108, 111]
 * ```
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert UTF-8 encoded bytes to a string.
 *
 * @param bytes - The UTF-8 bytes to decode
 * @returns The decoded string
 *
 * @example
 * ```ts
 * import { bytesToString } from "@zig-wasm/core";
 *
 * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
 * console.log(bytesToString(bytes)); // "Hello"
 * ```
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
