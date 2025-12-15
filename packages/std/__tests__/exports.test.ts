import * as std from "@zig-wasm/std";
import { describe, expect, it } from "vitest";

describe("@zig-wasm/std exports", () => {
  describe("Module Structure", () => {
    it("exposes namespaces for submodules", () => {
      expect(std.base64).toBeDefined();
      expect(std.crypto).toBeDefined();
      expect(std.hash).toBeDefined();
      expect(std.math).toBeDefined();
      expect(std.compress).toBeDefined();
    });

    it("re-exports selected core helpers", () => {
      expect(std.AllocationScope).toBeTypeOf("function");
      expect(std.WasmMemory).toBeTypeOf("function");
      expect(std.compareBytes).toBeTypeOf("function");
      expect(std.concatBytes).toBeTypeOf("function");
      expect(std.toHex).toBeTypeOf("function");
      expect(std.fromHex).toBeTypeOf("function");
      expect(std.getEnvironment).toBeTypeOf("function");
      expect(std.loadWasm).toBeTypeOf("function");
    });

    it("submodules have expected structure", () => {
      // base64 namespace
      expect(std.base64.encode).toBeTypeOf("function");
      expect(std.base64.decode).toBeTypeOf("function");
      expect(std.base64.encodeSync).toBeTypeOf("function");
      expect(std.base64.decodeSync).toBeTypeOf("function");

      // crypto namespace
      expect(std.crypto.sha256).toBeTypeOf("function");
      expect(std.crypto.blake3).toBeTypeOf("function");
      expect(std.crypto.hmac).toBeTypeOf("function");

      // hash namespace
      expect(std.hash.crc32).toBeTypeOf("function");

      // math namespace
      expect(std.math.abs).toBeTypeOf("function");
      expect(std.math.sqrt).toBeTypeOf("function");
      expect(std.math.pow).toBeTypeOf("function");

      // compress namespace
      expect(std.compress.decompressXz).toBeTypeOf("function");
      expect(std.compress.decompressLzma).toBeTypeOf("function");
    });
  });

  describe("Byte Manipulation Utilities", () => {
    describe("toHex", () => {
      it("converts empty bytes to empty string", () => {
        const bytes = new Uint8Array([]);
        expect(std.toHex(bytes)).toBe("");
      });

      it("converts single byte to hex", () => {
        const bytes = new Uint8Array([0xff]);
        expect(std.toHex(bytes)).toBe("ff");
      });

      it("converts multiple bytes to hex string", () => {
        const bytes = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
        expect(std.toHex(bytes)).toBe("1234abcd");
      });

      it("pads single-digit hex values with zero", () => {
        const bytes = new Uint8Array([0x00, 0x01, 0x0f]);
        expect(std.toHex(bytes)).toBe("00010f");
      });

      it("handles all byte values correctly", () => {
        const bytes = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
          bytes[i] = i;
        }
        const hex = std.toHex(bytes);
        expect(hex.length).toBe(512);
        expect(hex.startsWith("000102")).toBe(true);
        expect(hex.endsWith("fdfeff")).toBe(true);
      });
    });

    describe("fromHex", () => {
      it("converts empty string to empty bytes", () => {
        const bytes = std.fromHex("");
        expect(bytes).toEqual(new Uint8Array([]));
      });

      it("converts hex string to bytes", () => {
        const bytes = std.fromHex("1234abcd");
        expect(bytes).toEqual(new Uint8Array([0x12, 0x34, 0xab, 0xcd]));
      });

      it("handles uppercase hex", () => {
        const bytes = std.fromHex("ABCDEF");
        expect(bytes).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
      });

      it("handles mixed case hex", () => {
        const bytes = std.fromHex("aBcDeF");
        expect(bytes).toEqual(new Uint8Array([0xab, 0xcd, 0xef]));
      });

      it("handles leading zeros", () => {
        const bytes = std.fromHex("00010f");
        expect(bytes).toEqual(new Uint8Array([0x00, 0x01, 0x0f]));
      });

      it("throws on odd length hex string", () => {
        expect(() => std.fromHex("abc")).toThrow("Hex string must have even length");
      });

      it("throws on invalid hex characters", () => {
        expect(() => std.fromHex("abcg")).toThrow(/Invalid hex character/);
        expect(() => std.fromHex("1234  ")).toThrow(/Invalid hex character/);
        expect(() => std.fromHex("xy")).toThrow(/Invalid hex character/);
      });

      it("roundtrips with toHex", () => {
        const original = new Uint8Array([0, 15, 16, 127, 128, 255]);
        const hex = std.toHex(original);
        const restored = std.fromHex(hex);
        expect(restored).toEqual(original);
      });
    });

    describe("concatBytes", () => {
      it("concatenates zero arrays to empty result", () => {
        const result = std.concatBytes();
        expect(result).toEqual(new Uint8Array([]));
      });

      it("returns copy of single array", () => {
        const arr = new Uint8Array([1, 2, 3]);
        const result = std.concatBytes(arr);
        expect(result).toEqual(arr);
        expect(result).not.toBe(arr); // Should be a copy
      });

      it("concatenates two arrays", () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3, 4]);
        const result = std.concatBytes(a, b);
        expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
      });

      it("concatenates multiple arrays", () => {
        const a = new Uint8Array([1]);
        const b = new Uint8Array([2, 3]);
        const c = new Uint8Array([4, 5, 6]);
        const result = std.concatBytes(a, b, c);
        expect(result).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
      });

      it("handles empty arrays in sequence", () => {
        const a = new Uint8Array([1]);
        const b = new Uint8Array([]);
        const c = new Uint8Array([2]);
        const result = std.concatBytes(a, b, c);
        expect(result).toEqual(new Uint8Array([1, 2]));
      });

      it("preserves byte values correctly", () => {
        const a = new Uint8Array([0, 127]);
        const b = new Uint8Array([128, 255]);
        const result = std.concatBytes(a, b);
        expect(result).toEqual(new Uint8Array([0, 127, 128, 255]));
      });

      it("handles large arrays efficiently", () => {
        const a = new Uint8Array(1000).fill(1);
        const b = new Uint8Array(1000).fill(2);
        const c = new Uint8Array(1000).fill(3);
        const result = std.concatBytes(a, b, c);
        expect(result.length).toBe(3000);
        expect(result[0]).toBe(1);
        expect(result[1000]).toBe(2);
        expect(result[2000]).toBe(3);
      });
    });

    describe("compareBytes", () => {
      it("returns true for empty arrays", () => {
        expect(std.compareBytes(new Uint8Array([]), new Uint8Array([]))).toBe(true);
      });

      it("returns true for identical arrays", () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([1, 2, 3]);
        expect(std.compareBytes(a, b)).toBe(true);
      });

      it("returns false for different lengths", () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([1, 2, 3]);
        expect(std.compareBytes(a, b)).toBe(false);
      });

      it("returns false for different values", () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([1, 2, 4]);
        expect(std.compareBytes(a, b)).toBe(false);
      });

      it("detects difference at start", () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([2, 2, 3]);
        expect(std.compareBytes(a, b)).toBe(false);
      });

      it("detects difference at end", () => {
        const a = new Uint8Array([1, 2, 3]);
        const b = new Uint8Array([1, 2, 4]);
        expect(std.compareBytes(a, b)).toBe(false);
      });

      it("handles all byte values", () => {
        const a = new Uint8Array([0, 127, 128, 255]);
        const b = new Uint8Array([0, 127, 128, 255]);
        expect(std.compareBytes(a, b)).toBe(true);
      });

      it("handles large arrays", () => {
        const size = 10000;
        const a = new Uint8Array(size);
        const b = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
          a[i] = i % 256;
          b[i] = i % 256;
        }
        expect(std.compareBytes(a, b)).toBe(true);

        // Modify last element to make arrays different
        const lastIdx = size - 1;
        const lastValue = b[lastIdx];
        if (lastValue !== undefined) {
          b[lastIdx] = (lastValue + 1) % 256;
        }
        expect(std.compareBytes(a, b)).toBe(false);
      });
    });
  });

  describe("Integration Patterns", () => {
    it("utilities work together for data transformation", () => {
      // Create some test data
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      // Convert to hex
      const hex = std.toHex(data);
      expect(hex).toBe("48656c6c6f");

      // Convert back from hex
      const restored = std.fromHex(hex);
      expect(std.compareBytes(data, restored)).toBe(true);
    });

    it("supports chained byte operations", () => {
      const part1 = new Uint8Array([1, 2]);
      const part2 = new Uint8Array([3, 4]);
      const part3 = new Uint8Array([5, 6]);

      // Concatenate and verify
      const combined = std.concatBytes(part1, part2, part3);
      expect(combined).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));

      // Convert to hex and back
      const hex = std.toHex(combined);
      const restored = std.fromHex(hex);
      expect(std.compareBytes(combined, restored)).toBe(true);
    });

    it("handles binary data with hex encoding roundtrip", () => {
      // Create random-like binary data
      const binary = new Uint8Array(32);
      for (let i = 0; i < binary.length; i++) {
        binary[i] = (i * 7 + 13) % 256;
      }

      const hex = std.toHex(binary);
      expect(hex.length).toBe(64); // 32 bytes = 64 hex chars

      const decoded = std.fromHex(hex);
      expect(std.compareBytes(binary, decoded)).toBe(true);
    });
  });

  describe("Environment Detection", () => {
    it("getEnvironment returns valid environment", () => {
      const env = std.getEnvironment();
      expect(env).toHaveProperty("isNode");
      expect(env).toHaveProperty("isBrowser");
      expect(env).toHaveProperty("isDeno");
      expect(env).toHaveProperty("isBun");
      expect(env).toHaveProperty("supportsStreaming");
    });

    it("getEnvironment is consistent across calls", () => {
      const env1 = std.getEnvironment();
      const env2 = std.getEnvironment();
      expect(env1).toBe(env2);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    describe("Byte Operations Edge Cases", () => {
      it("handles max Uint8Array value", () => {
        const bytes = new Uint8Array([255, 255, 255]);
        const hex = std.toHex(bytes);
        expect(hex).toBe("ffffff");
        const restored = std.fromHex(hex);
        expect(restored).toEqual(bytes);
      });

      it("handles zero-filled arrays", () => {
        const zeros = new Uint8Array(100);
        const hex = std.toHex(zeros);
        expect(hex).toBe("0".repeat(200));
        const restored = std.fromHex(hex);
        expect(std.compareBytes(zeros, restored)).toBe(true);
      });

      it("concatBytes preserves individual array integrity", () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3, 4]);
        const result = std.concatBytes(a, b);

        // Original arrays should not be modified
        expect(a).toEqual(new Uint8Array([1, 2]));
        expect(b).toEqual(new Uint8Array([3, 4]));
        expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
      });
    });

    describe("Hex Conversion Edge Cases", () => {
      it("fromHex rejects non-hex characters", () => {
        const invalid = ["zz", "!!", "  ", "g0", "0g"];
        for (const hex of invalid) {
          expect(() => std.fromHex(hex)).toThrow(/Invalid hex character/);
        }
      });

      it("fromHex handles case insensitivity", () => {
        expect(std.fromHex("aA")).toEqual(std.fromHex("aa"));
        expect(std.fromHex("FF")).toEqual(std.fromHex("ff"));
        expect(std.fromHex("Ab12")).toEqual(std.fromHex("AB12"));
      });
    });

    describe("Comparison Edge Cases", () => {
      it("compareBytes handles same reference", () => {
        const arr = new Uint8Array([1, 2, 3]);
        expect(std.compareBytes(arr, arr)).toBe(true);
      });

      it("compareBytes differentiates similar arrays", () => {
        const a = new Uint8Array([1, 2, 3, 4]);
        const b = new Uint8Array([1, 2, 3, 5]);
        expect(std.compareBytes(a, b)).toBe(false);
      });
    });
  });

  describe("Type Safety and Exports", () => {
    it("AllocationScope is a constructor", () => {
      expect(std.AllocationScope).toBeInstanceOf(Function);
      expect(std.AllocationScope.name).toBe("AllocationScope");
    });

    it("WasmMemory is a constructor", () => {
      expect(std.WasmMemory).toBeInstanceOf(Function);
      expect(std.WasmMemory.name).toBe("WasmMemory");
    });

    it("utility functions are proper functions", () => {
      expect(std.toHex).toBeInstanceOf(Function);
      expect(std.fromHex).toBeInstanceOf(Function);
      expect(std.concatBytes).toBeInstanceOf(Function);
      expect(std.compareBytes).toBeInstanceOf(Function);
      expect(std.loadWasm).toBeInstanceOf(Function);
    });

    it("all submodule namespaces are objects", () => {
      expect(typeof std.base64).toBe("object");
      expect(typeof std.crypto).toBe("object");
      expect(typeof std.hash).toBe("object");
      expect(typeof std.math).toBe("object");
      expect(typeof std.compress).toBe("object");
    });
  });

  describe("Performance Characteristics", () => {
    it("toHex handles large arrays efficiently", () => {
      const large = new Uint8Array(10000);
      for (let i = 0; i < large.length; i++) {
        large[i] = i % 256;
      }

      const start = performance.now();
      const hex = std.toHex(large);
      const duration = performance.now() - start;

      expect(hex.length).toBe(20000);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it("fromHex handles large hex strings efficiently", () => {
      const hexStr = "ab".repeat(10000);

      const start = performance.now();
      const bytes = std.fromHex(hexStr);
      const duration = performance.now() - start;

      expect(bytes.length).toBe(10000);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it("concatBytes handles many arrays efficiently", () => {
      const arrays = Array.from({ length: 100 }, () => new Uint8Array([1, 2, 3]));

      const start = performance.now();
      const result = std.concatBytes(...arrays);
      const duration = performance.now() - start;

      expect(result.length).toBe(300);
      expect(duration).toBeLessThan(50); // Should be fast
    });

    it("compareBytes short-circuits on length mismatch", () => {
      const a = new Uint8Array(10000).fill(1);
      const b = new Uint8Array(10001).fill(1);

      const start = performance.now();
      const result = std.compareBytes(a, b);
      const duration = performance.now() - start;

      expect(result).toBe(false);
      expect(duration).toBeLessThan(1); // Should be instant
    });
  });
});
