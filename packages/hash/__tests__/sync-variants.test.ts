/**
 * Tests for sync variants and hex output functions.
 * Uses deterministic test vectors generated from Zig's stdlib.
 */

import * as hash from "@zig-wasm/hash";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import testVectors from "./fixtures/test-vectors.json";

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), "../wasm/hash.wasm");

// Looser types to avoid strict key checking on dynamic JSON
type HashVectors = Record<string, string>;
type SeededVectors = Record<string, HashVectors>;

// Test inputs matching those in the Zig generator
const TEST_INPUTS: Record<string, string | Uint8Array> = {
  empty: "",
  test: "test",
  hello: "hello",
  "123456789": "123456789",
  single_a: "a",
  single_null: new Uint8Array([0x00]),
  single_ff: new Uint8Array([0xff]),
  hello_world: "Hello, World!",
  quick_brown_fox: "The quick brown fox jumps over the lazy dog",
  pangram_lower: "the quick brown fox jumps over the lazy dog",
  unicode_emoji: "\u{1F600}",
  unicode_chinese: "\u4E2D\u6587",
  unicode_mixed: "Hello \u4E16\u754C \u{1F30D}",
  all_zeros_8: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]),
  all_ones_8: new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
  len_1: "x",
  len_7: "1234567",
  len_8: "12345678",
  len_16: "1234567890123456",
  len_32: "12345678901234567890123456789012",
  len_64: "1234567890123456789012345678901234567890123456789012345678901234",
  spaces: "   ",
  json_like: "{\"key\": \"value\", \"num\": 123}",
  null_in_middle: "before\x00after",
};

describe("@zig-wasm/hash - Deterministic Test Vectors", () => {
  beforeAll(async () => {
    await hash.init({ wasmPath });
  });

  describe("crc32HexSync", () => {
    const vectors = testVectors.crc32 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("crc32(%s) matches expected", (name, input) => {
      const result = hash.crc32HexSync(input);
      expect(result).toBe(vectors[name]);
    });
  });

  describe("adler32HexSync", () => {
    const vectors = testVectors.adler32 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("adler32(%s) matches expected", (name, input) => {
      const result = hash.adler32HexSync(input);
      expect(result).toBe(vectors[name]);
    });
  });

  describe("xxhash32HexSync", () => {
    const vectors = testVectors.xxhash32 as HashVectors;
    const seededVectors = testVectors.xxhash32_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("xxhash32(%s) matches expected", (name, input) => {
      const result = hash.xxhash32HexSync(input);
      expect(result).toBe(vectors[name]);
    });

    it("xxhash32 with seed=0 matches unseeded", () => {
      expect(hash.xxhash32HexSync("test", 0)).toBe(vectors.test);
    });

    it("xxhash32 with seed=42 matches expected", () => {
      expect(hash.xxhash32HexSync("test", 42)).toBe(seededVectors["42"]!.test);
    });

    it("xxhash32 with seed=0xDEADBEEF matches expected", () => {
      expect(hash.xxhash32HexSync("test", 0xdeadbeef)).toBe(seededVectors["3735928559"]!.test);
    });
  });

  describe("xxhash64HexSync", () => {
    const vectors = testVectors.xxhash64 as HashVectors;
    const seededVectors = testVectors.xxhash64_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("xxhash64(%s) matches expected", (name, input) => {
      const result = hash.xxhash64HexSync(input);
      expect(result).toBe(vectors[name]);
    });

    it("xxhash64 with seed=0n matches unseeded", () => {
      expect(hash.xxhash64HexSync("test", 0n)).toBe(vectors.test);
    });

    it("xxhash64 with seed=42n matches expected", () => {
      expect(hash.xxhash64HexSync("test", 42n)).toBe(seededVectors["42"]!.test);
    });
  });

  describe("wyhashHexSync", () => {
    const vectors = testVectors.wyhash as HashVectors;
    const seededVectors = testVectors.wyhash_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("wyhash(%s) matches expected", (name, input) => {
      const result = hash.wyhashHexSync(input);
      expect(result).toBe(vectors[name]);
    });

    it("wyhash with seed=0n matches unseeded", () => {
      expect(hash.wyhashHexSync("test", 0n)).toBe(vectors.test);
    });

    it("wyhash with seed=42n matches expected", () => {
      expect(hash.wyhashHexSync("test", 42n)).toBe(seededVectors["42"]!.test);
    });
  });

  describe("cityhash64HexSync", () => {
    const vectors = testVectors.cityhash64 as HashVectors;
    const seededVectors = testVectors.cityhash64_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("cityhash64(%s) matches expected", (name, input) => {
      const result = hash.cityhash64HexSync(input);
      expect(result).toBe(vectors[name]);
    });

    it("cityhash64 with seed=42n matches expected", () => {
      expect(hash.cityhash64HexSync("test", 42n)).toBe(seededVectors["42"]!.test);
    });
  });

  describe("murmur2_64HexSync", () => {
    const vectors = testVectors.murmur2_64 as HashVectors;
    const seededVectors = testVectors.murmur2_64_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("murmur2_64(%s) matches expected", (name, input) => {
      const result = hash.murmur2_64HexSync(input);
      expect(result).toBe(vectors[name]);
    });

    it("murmur2_64 with seed=42n matches expected", () => {
      expect(hash.murmur2_64HexSync("test", 42n)).toBe(seededVectors["42"]!.test);
    });
  });

  describe("fnv1a64HexSync", () => {
    const vectors = testVectors.fnv1a64 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("fnv1a64(%s) matches expected", (name, input) => {
      const result = hash.fnv1a64HexSync(input);
      expect(result).toBe(vectors[name]);
    });
  });

  describe("fnv1a32HexSync", () => {
    const vectors = testVectors.fnv1a32 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("fnv1a32(%s) matches expected", (name, input) => {
      const result = hash.fnv1a32HexSync(input);
      expect(result).toBe(vectors[name]);
    });
  });
});

describe("@zig-wasm/hash - Generic hashSync and hashHexSync", () => {
  beforeAll(async () => {
    await hash.init({ wasmPath });
  });

  describe("hashHexSync with deterministic vectors", () => {
    it("hashHexSync(crc32, test) matches expected", () => {
      expect(hash.hashHexSync("crc32", "test")).toBe(testVectors.crc32.test);
    });

    it("hashHexSync(adler32, test) matches expected", () => {
      expect(hash.hashHexSync("adler32", "test")).toBe(testVectors.adler32.test);
    });

    it("hashHexSync(xxhash32, test) matches expected", () => {
      expect(hash.hashHexSync("xxhash32", "test")).toBe(testVectors.xxhash32.test);
    });

    it("hashHexSync(xxhash64, test) matches expected", () => {
      expect(hash.hashHexSync("xxhash64", "test")).toBe(testVectors.xxhash64.test);
    });

    it("hashHexSync(wyhash, test) matches expected", () => {
      expect(hash.hashHexSync("wyhash", "test")).toBe(testVectors.wyhash.test);
    });

    it("hashHexSync(cityhash64, test) matches expected", () => {
      expect(hash.hashHexSync("cityhash64", "test")).toBe(testVectors.cityhash64.test);
    });

    it("hashHexSync(murmur2_64, test) matches expected", () => {
      expect(hash.hashHexSync("murmur2_64", "test")).toBe(testVectors.murmur2_64.test);
    });

    it("hashHexSync(fnv1a32, test) matches expected", () => {
      expect(hash.hashHexSync("fnv1a32", "test")).toBe(testVectors.fnv1a32.test);
    });

    it("hashHexSync(fnv1a64, test) matches expected", () => {
      expect(hash.hashHexSync("fnv1a64", "test")).toBe(testVectors.fnv1a64.test);
    });
  });

  describe("hashSync returns correct types", () => {
    it("returns number for 32-bit algorithms", () => {
      expect(typeof hash.hashSync("crc32", "test")).toBe("number");
      expect(typeof hash.hashSync("adler32", "test")).toBe("number");
      expect(typeof hash.hashSync("xxhash32", "test")).toBe("number");
      expect(typeof hash.hashSync("fnv1a32", "test")).toBe("number");
    });

    it("returns bigint for 64-bit algorithms", () => {
      expect(typeof hash.hashSync("xxhash64", "test")).toBe("bigint");
      expect(typeof hash.hashSync("wyhash", "test")).toBe("bigint");
      expect(typeof hash.hashSync("cityhash64", "test")).toBe("bigint");
      expect(typeof hash.hashSync("murmur2_64", "test")).toBe("bigint");
      expect(typeof hash.hashSync("fnv1a64", "test")).toBe("bigint");
    });
  });
});

describe("@zig-wasm/hash - Edge Cases", () => {
  beforeAll(async () => {
    await hash.init({ wasmPath });
  });

  it("handles binary data with null bytes", () => {
    const withNull = new Uint8Array([0x00, 0x01, 0x02]);
    const result = hash.crc32HexSync(withNull);
    expect(result).toMatch(/^[0-9a-f]{8}$/);
  });

  it("handles unicode strings correctly", () => {
    expect(hash.crc32HexSync("\u{1F600}")).toBe(testVectors.crc32.unicode_emoji);
  });

  it("handles empty input", () => {
    expect(hash.crc32HexSync("")).toBe(testVectors.crc32.empty);
    expect(hash.xxhash64HexSync("")).toBe(testVectors.xxhash64.empty);
    expect(hash.wyhashHexSync("")).toBe(testVectors.wyhash.empty);
  });

  it("is deterministic across multiple calls", () => {
    const input = "determinism test";
    const results = Array.from({ length: 10 }, () => hash.wyhashHexSync(input));
    expect(new Set(results).size).toBe(1);
  });
});

describe("@zig-wasm/hash - Concurrent Initialization", () => {
  it("handles concurrent init calls safely", async () => {
    const hashModule = await import("@zig-wasm/hash");

    const promises = [
      hashModule.init({ wasmPath }),
      hashModule.init({ wasmPath }),
      hashModule.init({ wasmPath }),
    ];

    await Promise.all(promises);

    expect(hashModule.isInitialized()).toBe(true);
    expect(hashModule.crc32HexSync("test")).toBe(testVectors.crc32.test);
  });
});
