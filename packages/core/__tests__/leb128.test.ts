import { decodeSleb128, decodeUleb128, encodeSleb128, encodeUleb128 } from "@zig-wasm/core";
import { describe, expect, it } from "vitest";

describe("leb128", () => {
  describe("encodeUleb128", () => {
    it.each([
      [0, [0x00]],
      [1, [0x01]],
      [63, [0x3f]],
      [64, [0x40]],
      [127, [0x7f]],
      [128, [0x80, 0x01]],
      [129, [0x81, 0x01]],
      [255, [0xff, 0x01]],
      [256, [0x80, 0x02]],
      [300, [0xac, 0x02]],
      [16383, [0xff, 0x7f]],
      [16384, [0x80, 0x80, 0x01]],
      [2097151, [0xff, 0xff, 0x7f]],
      [2097152, [0x80, 0x80, 0x80, 0x01]],
    ])("encodes %i as %o", (value, expected) => {
      expect(encodeUleb128(value)).toEqual(expected);
    });

    it("throws on negative values", () => {
      expect(() => encodeUleb128(-1)).toThrow("non-negative integer");
    });

    it("throws on non-integers", () => {
      expect(() => encodeUleb128(1.5)).toThrow("non-negative integer");
    });
  });

  describe("encodeSleb128", () => {
    it.each([
      // Positive values
      [0, [0x00]],
      [1, [0x01]],
      [63, [0x3f]],
      [64, [0xc0, 0x00]], // needs extra byte for sign
      [127, [0xff, 0x00]],
      [128, [0x80, 0x01]],
      [8191, [0xff, 0x3f]],
      [8192, [0x80, 0xc0, 0x00]],
      // Negative values
      [-1, [0x7f]],
      [-2, [0x7e]],
      [-64, [0x40]],
      [-65, [0xbf, 0x7f]],
      [-128, [0x80, 0x7f]],
      [-129, [0xff, 0x7e]],
      [-8192, [0x80, 0x40]],
      [-8193, [0xff, 0xbf, 0x7f]],
    ])("encodes %i as %o", (value, expected) => {
      expect(encodeSleb128(value)).toEqual(expected);
    });

    it("handles edge case: 100 (used in panic tests)", () => {
      // This is critical - value 100 needs 2 bytes because bit 6 would indicate negative
      expect(encodeSleb128(100)).toEqual([0xe4, 0x00]);
    });
  });

  describe("decodeUleb128", () => {
    it.each([
      [[0x00], 0, 0, 1],
      [[0x01], 0, 1, 1],
      [[0x7f], 0, 127, 1],
      [[0x80, 0x01], 0, 128, 2],
      [[0xff, 0x01], 0, 255, 2],
      [[0x80, 0x80, 0x01], 0, 16384, 3],
      [[0xac, 0x02], 0, 300, 2],
      // With offset
      [[0x00, 0x80, 0x01], 1, 128, 2],
      [[0x00, 0x00, 0xff, 0x7f], 2, 16383, 2],
    ])("decodes %o at pos %i as [%i, %i]", (bytes, pos, expectedValue, expectedConsumed) => {
      const [value, consumed] = decodeUleb128(bytes, pos);
      expect(value).toBe(expectedValue);
      expect(consumed).toBe(expectedConsumed);
    });

    it("throws on unterminated LEB128", () => {
      expect(() => decodeUleb128([0x80, 0x80], 0)).toThrow("Unterminated LEB128");
    });

    it("throws when running past end", () => {
      expect(() => decodeUleb128([0x80], 0)).toThrow("Unterminated LEB128");
    });
  });

  describe("decodeSleb128", () => {
    it.each([
      // Positive
      [[0x00], 0, 0, 1],
      [[0x01], 0, 1, 1],
      [[0x3f], 0, 63, 1],
      [[0xc0, 0x00], 0, 64, 2],
      [[0xff, 0x00], 0, 127, 2],
      // Negative
      [[0x7f], 0, -1, 1],
      [[0x7e], 0, -2, 1],
      [[0x40], 0, -64, 1],
      [[0xbf, 0x7f], 0, -65, 2],
      [[0x80, 0x7f], 0, -128, 2],
      // With offset
      [[0x00, 0x7f], 1, -1, 1],
      [[0x00, 0xc0, 0x00], 1, 64, 2],
    ])("decodes %o at pos %i as [%i, %i]", (bytes, pos, expectedValue, expectedConsumed) => {
      const [value, consumed] = decodeSleb128(bytes, pos);
      expect(value).toBe(expectedValue);
      expect(consumed).toBe(expectedConsumed);
    });

    it("handles edge case: 100", () => {
      const [value, consumed] = decodeSleb128([0xe4, 0x00], 0);
      expect(value).toBe(100);
      expect(consumed).toBe(2);
    });

    it("throws on unterminated LEB128", () => {
      expect(() => decodeSleb128([0x80, 0x80], 0)).toThrow("Unterminated LEB128");
    });
  });

  describe("roundtrip", () => {
    it("roundtrips unsigned values", () => {
      const values = [0, 1, 127, 128, 255, 256, 16384, 65535, 2097152];
      for (const v of values) {
        const encoded = encodeUleb128(v);
        const [decoded] = decodeUleb128(encoded, 0);
        expect(decoded).toBe(v);
      }
    });

    it("roundtrips signed values", () => {
      const values = [0, 1, 63, 64, 127, 128, -1, -64, -65, -128, -129, 8192, -8192];
      for (const v of values) {
        const encoded = encodeSleb128(v);
        const [decoded] = decodeSleb128(encoded, 0);
        expect(decoded).toBe(v);
      }
    });
  });
});
