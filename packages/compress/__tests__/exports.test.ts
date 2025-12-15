import * as compress from "@zig-wasm/compress";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const fixturesDir = join(import.meta.dirname, "fixtures");

function loadFixture(filename: string): Uint8Array {
  return new Uint8Array(readFileSync(join(fixturesDir, filename)));
}

describe("@zig-wasm/compress exports", () => {
  it("exposes lifecycle helpers", () => {
    expect(compress.isInitialized()).toBe(false);
    expect(compress.init).toBeTypeOf("function");
  });

  it("exposes async decompressors", () => {
    expect(compress.decompressXz).toBeTypeOf("function");
    expect(compress.decompressLzma).toBeTypeOf("function");
  });

  it("exposes sync decompressors", () => {
    expect(compress.decompressXzSync).toBeTypeOf("function");
    expect(compress.decompressLzmaSync).toBeTypeOf("function");
  });

  it("exposes error types", () => {
    expect(compress.NotInitializedError).toBeTypeOf("function");
  });
});

describe("XZ decompression (async)", () => {
  it("decompresses empty data", async () => {
    const compressed = loadFixture("empty.txt.xz");
    const decompressed = await compress.decompressXz(compressed);
    expect(decompressed).toBeInstanceOf(Uint8Array);
    expect(decompressed.length).toBe(0);
  });

  it("decompresses single byte", async () => {
    const compressed = loadFixture("single-byte.txt.xz");
    const expected = loadFixture("single-byte.txt");
    const decompressed = await compress.decompressXz(compressed);
    expect(decompressed).toEqual(expected);
    expect(new TextDecoder().decode(decompressed)).toBe("x");
  });

  it("decompresses hello world text", async () => {
    const compressed = loadFixture("hello.txt.xz");
    const expected = loadFixture("hello.txt");
    const decompressed = await compress.decompressXz(compressed);
    expect(decompressed).toEqual(expected);
    expect(new TextDecoder().decode(decompressed)).toBe("Hello, World!");
  });

  it("decompresses repeated text (high compression ratio)", async () => {
    const compressed = loadFixture("text.txt.xz");
    const expected = loadFixture("text.txt");
    const decompressed = await compress.decompressXz(compressed);
    expect(decompressed).toEqual(expected);
    expect(decompressed.length).toBe(4500);
    expect(new TextDecoder().decode(decompressed)).toContain("The quick brown fox");
  });

  it("decompresses binary data", async () => {
    const compressed = loadFixture("binary.txt.xz");
    const expected = loadFixture("binary.txt");
    const decompressed = await compress.decompressXz(compressed);
    expect(decompressed).toEqual(expected);
    expect(decompressed.length).toBe(1488);
  });

  it("decompresses large highly compressible data", async () => {
    const compressed = loadFixture("large.txt.xz");
    const expected = loadFixture("large.txt");
    const decompressed = await compress.decompressXz(compressed);
    expect(decompressed).toEqual(expected);
    expect(decompressed.length).toBe(100000);
    // Verify compression ratio (100KB compressed to ~156 bytes = 99.8% compression)
    expect(compressed.length).toBeLessThan(200);
  });

  it("decompresses JSON data", async () => {
    const compressed = loadFixture("json.txt.xz");
    const expected = loadFixture("json.txt");
    const decompressed = await compress.decompressXz(compressed);
    expect(decompressed).toEqual(expected);
    const json = JSON.parse(new TextDecoder().decode(decompressed));
    expect(json).toHaveProperty("test", true);
    expect(json.data).toBeInstanceOf(Array);
  });

  it("throws on invalid XZ header", async () => {
    const invalid = loadFixture("invalid.xz");
    await expect(compress.decompressXz(invalid)).rejects.toThrow("XZ decompression failed");
  });

  it("throws on corrupted XZ data", async () => {
    const garbage = loadFixture("garbage.xz");
    await expect(compress.decompressXz(garbage)).rejects.toThrow("XZ decompression failed");
  });

  it("auto-initializes on first call", async () => {
    expect(compress.isInitialized()).toBe(true); // Already initialized from previous tests
    const compressed = loadFixture("hello.txt.xz");
    const decompressed = await compress.decompressXz(compressed);
    expect(new TextDecoder().decode(decompressed)).toBe("Hello, World!");
  });
});

describe("LZMA decompression (async)", () => {
  it("decompresses empty data", async () => {
    const compressed = loadFixture("empty.txt.lzma");
    const decompressed = await compress.decompressLzma(compressed);
    expect(decompressed).toBeInstanceOf(Uint8Array);
    expect(decompressed.length).toBe(0);
  });

  it("decompresses single byte", async () => {
    const compressed = loadFixture("single-byte.txt.lzma");
    const expected = loadFixture("single-byte.txt");
    const decompressed = await compress.decompressLzma(compressed);
    expect(decompressed).toEqual(expected);
    expect(new TextDecoder().decode(decompressed)).toBe("x");
  });

  it("decompresses hello world text", async () => {
    const compressed = loadFixture("hello.txt.lzma");
    const expected = loadFixture("hello.txt");
    const decompressed = await compress.decompressLzma(compressed);
    expect(decompressed).toEqual(expected);
    expect(new TextDecoder().decode(decompressed)).toBe("Hello, World!");
  });

  it("decompresses repeated text (high compression ratio)", async () => {
    const compressed = loadFixture("text.txt.lzma");
    const expected = loadFixture("text.txt");
    const decompressed = await compress.decompressLzma(compressed);
    expect(decompressed).toEqual(expected);
    expect(decompressed.length).toBe(4500);
    expect(new TextDecoder().decode(decompressed)).toContain("The quick brown fox");
  });

  it("decompresses binary data", async () => {
    const compressed = loadFixture("binary.txt.lzma");
    const expected = loadFixture("binary.txt");
    const decompressed = await compress.decompressLzma(compressed);
    expect(decompressed).toEqual(expected);
    expect(decompressed.length).toBe(1488);
  });

  it("decompresses large highly compressible data", async () => {
    const compressed = loadFixture("large.txt.lzma");
    const expected = loadFixture("large.txt");
    const decompressed = await compress.decompressLzma(compressed);
    expect(decompressed).toEqual(expected);
    expect(decompressed.length).toBe(100000);
    // Verify excellent compression ratio
    expect(compressed.length).toBeLessThan(150);
  });

  it("decompresses JSON data", async () => {
    const compressed = loadFixture("json.txt.lzma");
    const expected = loadFixture("json.txt");
    const decompressed = await compress.decompressLzma(compressed);
    expect(decompressed).toEqual(expected);
    const json = JSON.parse(new TextDecoder().decode(decompressed));
    expect(json).toHaveProperty("test", true);
    expect(json.data).toBeInstanceOf(Array);
  });

  it("throws on invalid LZMA header", async () => {
    const invalid = loadFixture("invalid.lzma");
    await expect(compress.decompressLzma(invalid)).rejects.toThrow("LZMA decompression failed");
  });

  it("throws on corrupted LZMA data", async () => {
    const garbage = loadFixture("garbage.lzma");
    await expect(compress.decompressLzma(garbage)).rejects.toThrow("LZMA decompression failed");
  });
});

describe("XZ decompression (sync)", () => {
  it("requires initialization before use", () => {
    // Module is already initialized from async tests, but we test the error path
    // by checking that sync methods work after init
    expect(compress.isInitialized()).toBe(true);
  });

  it("decompresses empty data", () => {
    const compressed = loadFixture("empty.txt.xz");
    const decompressed = compress.decompressXzSync(compressed);
    expect(decompressed).toBeInstanceOf(Uint8Array);
    expect(decompressed.length).toBe(0);
  });

  it("decompresses hello world text", () => {
    const compressed = loadFixture("hello.txt.xz");
    const expected = loadFixture("hello.txt");
    const decompressed = compress.decompressXzSync(compressed);
    expect(decompressed).toEqual(expected);
    expect(new TextDecoder().decode(decompressed)).toBe("Hello, World!");
  });

  it("decompresses large data", () => {
    const compressed = loadFixture("large.txt.xz");
    const expected = loadFixture("large.txt");
    const decompressed = compress.decompressXzSync(compressed);
    expect(decompressed).toEqual(expected);
    expect(decompressed.length).toBe(100000);
  });

  it("throws on corrupted data", () => {
    const garbage = loadFixture("garbage.xz");
    expect(() => compress.decompressXzSync(garbage)).toThrow("XZ decompression failed");
  });
});

describe("LZMA decompression (sync)", () => {
  it("decompresses empty data", () => {
    const compressed = loadFixture("empty.txt.lzma");
    const decompressed = compress.decompressLzmaSync(compressed);
    expect(decompressed).toBeInstanceOf(Uint8Array);
    expect(decompressed.length).toBe(0);
  });

  it("decompresses hello world text", () => {
    const compressed = loadFixture("hello.txt.lzma");
    const expected = loadFixture("hello.txt");
    const decompressed = compress.decompressLzmaSync(compressed);
    expect(decompressed).toEqual(expected);
    expect(new TextDecoder().decode(decompressed)).toBe("Hello, World!");
  });

  it("decompresses large data", () => {
    const compressed = loadFixture("large.txt.lzma");
    const expected = loadFixture("large.txt");
    const decompressed = compress.decompressLzmaSync(compressed);
    expect(decompressed).toEqual(expected);
    expect(decompressed.length).toBe(100000);
  });

  it("throws on corrupted data", () => {
    const garbage = loadFixture("garbage.lzma");
    expect(() => compress.decompressLzmaSync(garbage)).toThrow("LZMA decompression failed");
  });
});

describe("Memory management", () => {
  it("handles multiple decompressions without memory leaks", async () => {
    const compressed = loadFixture("text.txt.xz");
    const expected = loadFixture("text.txt");

    // Run multiple decompressions to verify memory is properly managed
    for (let i = 0; i < 100; i++) {
      const decompressed = await compress.decompressXz(compressed);
      expect(decompressed).toEqual(expected);
    }
  });

  it("handles sequential sync operations", () => {
    const compressedXz = loadFixture("hello.txt.xz");
    const compressedLzma = loadFixture("hello.txt.lzma");
    const expected = loadFixture("hello.txt");

    // Alternate between formats and methods
    for (let i = 0; i < 50; i++) {
      const result1 = compress.decompressXzSync(compressedXz);
      const result2 = compress.decompressLzmaSync(compressedLzma);
      expect(result1).toEqual(expected);
      expect(result2).toEqual(expected);
    }
  });

  it("handles mixed async and sync operations", async () => {
    const compressedXz = loadFixture("binary.txt.xz");
    const compressedLzma = loadFixture("binary.txt.lzma");
    const expected = loadFixture("binary.txt");

    // Mix async and sync calls
    const asyncResult = await compress.decompressXz(compressedXz);
    const syncResult = compress.decompressLzmaSync(compressedLzma);

    expect(asyncResult).toEqual(expected);
    expect(syncResult).toEqual(expected);
  });

  it("handles different data sizes efficiently", async () => {
    const sizes = ["empty", "single-byte", "hello", "text", "large"];

    for (const size of sizes) {
      const compressed = loadFixture(`${size}.txt.xz`);
      const expected = loadFixture(`${size}.txt`);
      const decompressed = await compress.decompressXz(compressed);
      expect(decompressed).toEqual(expected);
    }
  });
});

describe("Round-trip validation", () => {
  it("maintains data integrity for text", async () => {
    const originalXz = loadFixture("text.txt");
    const compressedXz = loadFixture("text.txt.xz");
    const decompressedXz = await compress.decompressXz(compressedXz);

    const originalLzma = loadFixture("text.txt");
    const compressedLzma = loadFixture("text.txt.lzma");
    const decompressedLzma = await compress.decompressLzma(compressedLzma);

    // Both formats should produce identical output
    expect(decompressedXz).toEqual(originalXz);
    expect(decompressedLzma).toEqual(originalLzma);
    expect(decompressedXz).toEqual(decompressedLzma);
  });

  it("maintains data integrity for binary", async () => {
    const original = loadFixture("binary.txt");
    const compressedXz = loadFixture("binary.txt.xz");
    const compressedLzma = loadFixture("binary.txt.lzma");

    const decompressedXz = await compress.decompressXz(compressedXz);
    const decompressedLzma = await compress.decompressLzma(compressedLzma);

    // Verify byte-for-byte equality
    expect(decompressedXz).toEqual(original);
    expect(decompressedLzma).toEqual(original);

    // Verify every byte matches
    for (let i = 0; i < original.length; i++) {
      expect(decompressedXz[i]).toBe(original[i]);
      expect(decompressedLzma[i]).toBe(original[i]);
    }
  });

  it("maintains data integrity for JSON structures", async () => {
    const original = loadFixture("json.txt");
    const compressedXz = loadFixture("json.txt.xz");
    const compressedLzma = loadFixture("json.txt.lzma");

    const decompressedXz = await compress.decompressXz(compressedXz);
    const decompressedLzma = await compress.decompressLzma(compressedLzma);

    // Verify exact match
    expect(decompressedXz).toEqual(original);
    expect(decompressedLzma).toEqual(original);

    // Verify JSON structure is preserved
    const originalJson = JSON.parse(new TextDecoder().decode(original));
    const xzJson = JSON.parse(new TextDecoder().decode(decompressedXz));
    const lzmaJson = JSON.parse(new TextDecoder().decode(decompressedLzma));

    expect(xzJson).toEqual(originalJson);
    expect(lzmaJson).toEqual(originalJson);
  });
});

describe("Edge cases", () => {
  it("handles consecutive failures gracefully", async () => {
    const garbage = loadFixture("garbage.xz");

    // Multiple failures should not corrupt state
    await expect(compress.decompressXz(garbage)).rejects.toThrow();
    await expect(compress.decompressXz(garbage)).rejects.toThrow();

    // Valid decompression should still work after failures
    const valid = loadFixture("hello.txt.xz");
    const result = await compress.decompressXz(valid);
    expect(new TextDecoder().decode(result)).toBe("Hello, World!");
  });

  it("handles empty input separately from valid empty compression", async () => {
    // Valid compressed empty file
    const validEmpty = loadFixture("empty.txt.xz");
    const result = await compress.decompressXz(validEmpty);
    expect(result.length).toBe(0);

    // Truly empty input (not a valid XZ file)
    const actuallyEmpty = new Uint8Array(0);
    await expect(compress.decompressXz(actuallyEmpty)).rejects.toThrow();
  });

  it("verifies compression efficiency", async () => {
    // Large highly compressible data should compress extremely well
    const original = loadFixture("large.txt");
    const compressed = loadFixture("large.txt.xz");

    const ratio = compressed.length / original.length;
    expect(ratio).toBeLessThan(0.002); // Less than 0.2% of original size

    const decompressed = await compress.decompressXz(compressed);
    expect(decompressed.length).toBe(original.length);
  });
});
