/**
 * LEB128 (Little Endian Base 128) encoding and decoding utilities.
 *
 * LEB128 is a variable-length encoding for integers used extensively in WebAssembly
 * binary format for sizes, indices, and signed/unsigned integers.
 *
 * @example Encoding values
 * ```ts
 * import { encodeUleb128, encodeSleb128 } from "@zig-wasm/core";
 *
 * encodeUleb128(127);  // [0x7f]
 * encodeUleb128(128);  // [0x80, 0x01]
 * encodeSleb128(-1);   // [0x7f]
 * encodeSleb128(64);   // [0xc0, 0x00] (needs 2 bytes due to sign bit)
 * ```
 *
 * @example Decoding values
 * ```ts
 * import { decodeUleb128, decodeSleb128 } from "@zig-wasm/core";
 *
 * const data = new Uint8Array([0x80, 0x01, 0x7f]);
 * const [value, bytesRead] = decodeUleb128(data, 0);  // [128, 2]
 * const [signed, read] = decodeSleb128(data, 2);      // [-1, 1]
 * ```
 *
 * @module
 */

/**
 * Encode an unsigned integer as unsigned LEB128.
 *
 * @param value - Non-negative integer to encode (0 to 2^32-1)
 * @returns Array of bytes representing the LEB128 encoding
 * @throws {Error} If value is negative or not an integer
 *
 * @example
 * ```ts
 * encodeUleb128(0);      // [0x00]
 * encodeUleb128(127);    // [0x7f]
 * encodeUleb128(128);    // [0x80, 0x01]
 * encodeUleb128(16384);  // [0x80, 0x80, 0x01]
 * ```
 */
export function encodeUleb128(value: number): number[] {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`encodeUleb128 requires non-negative integer, got ${value}`);
  }

  const out: number[] = [];
  let v = value >>> 0; // 32-bit unsigned

  while (true) {
    const byte = v & 0x7f;
    v >>>= 7;

    if (v === 0) {
      out.push(byte);
      return out;
    }
    out.push(byte | 0x80);
  }
}

/**
 * Encode a signed integer as signed LEB128.
 *
 * @param value - Integer to encode (fits in 32-bit signed range)
 * @returns Array of bytes representing the signed LEB128 encoding
 *
 * @example
 * ```ts
 * encodeSleb128(0);    // [0x00]
 * encodeSleb128(63);   // [0x3f]
 * encodeSleb128(64);   // [0xc0, 0x00] - needs extra byte for sign
 * encodeSleb128(-1);   // [0x7f]
 * encodeSleb128(-64);  // [0x40]
 * encodeSleb128(-65);  // [0xbf, 0x7f]
 * ```
 */
export function encodeSleb128(value: number): number[] {
  const out: number[] = [];
  let v = value | 0; // keep as 32-bit signed for shifting behavior

  while (true) {
    const byte = v & 0x7f;
    v >>= 7; // arithmetic shift (preserves sign)

    const signBitSet = (byte & 0x40) !== 0;
    const done = (v === 0 && !signBitSet) || (v === -1 && signBitSet);

    if (done) {
      out.push(byte);
      return out;
    }
    out.push(byte | 0x80);
  }
}

/**
 * Decode an unsigned LEB128 value from a byte array.
 *
 * @param data - Byte array to read from
 * @param pos - Starting position in the array
 * @returns Tuple of [decoded value, number of bytes consumed]
 * @throws {Error} If LEB128 is unterminated (runs past end of data)
 *
 * @example
 * ```ts
 * const data = new Uint8Array([0x80, 0x01, 0x7f]);
 * const [value, bytesRead] = decodeUleb128(data, 0);
 * // value = 128, bytesRead = 2
 * ```
 */
export function decodeUleb128(data: ArrayLike<number>, pos: number): [number, number] {
  let result = 0;
  let shift = 0;
  let consumed = 0;

  while (pos + consumed < data.length) {
    const byte = data[pos + consumed];
    if (byte === undefined) {
      throw new Error(`Unterminated LEB128 at position ${pos}`);
    }
    consumed += 1;

    result |= (byte & 0x7f) << shift;

    if ((byte & 0x80) === 0) {
      return [result >>> 0, consumed];
    }

    shift += 7;
  }

  throw new Error(`Unterminated LEB128 at position ${pos}`);
}

/**
 * Decode a signed LEB128 value from a byte array.
 *
 * @param data - Byte array to read from
 * @param pos - Starting position in the array
 * @returns Tuple of [decoded value, number of bytes consumed]
 * @throws {Error} If LEB128 is unterminated (runs past end of data)
 *
 * @example
 * ```ts
 * const data = new Uint8Array([0x7f]);
 * const [value, bytesRead] = decodeSleb128(data, 0);
 * // value = -1, bytesRead = 1
 * ```
 */
export function decodeSleb128(data: ArrayLike<number>, pos: number): [number, number] {
  let result = 0;
  let shift = 0;
  let consumed = 0;
  let byte: number;

  while (pos + consumed < data.length) {
    const next = data[pos + consumed];
    if (next === undefined) {
      throw new Error(`Unterminated LEB128 at position ${pos}`);
    }
    byte = next;
    consumed += 1;

    result |= (byte & 0x7f) << shift;
    shift += 7;

    if ((byte & 0x80) === 0) {
      // Sign extend if the sign bit (bit 6 of last byte) is set
      if (shift < 32 && (byte & 0x40) !== 0) {
        result |= ~0 << shift;
      }
      return [result | 0, consumed]; // Force signed 32-bit
    }
  }

  throw new Error(`Unterminated LEB128 at position ${pos}`);
}
