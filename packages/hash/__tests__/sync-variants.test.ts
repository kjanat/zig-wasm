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

/**
 * Safely access a seeded vector with descriptive error on missing data.
 */
function requireSeededVector(
  vectors: SeededVectors,
  seed: string,
  key: string,
  algo: string,
): string {
  const seedVectors = vectors[seed];
  if (!seedVectors) {
    throw new Error(`Missing seed "${seed}" in ${algo}_seeded fixture`);
  }
  const value = seedVectors[key];
  if (value === undefined) {
    throw new Error(`Missing key "${key}" for seed "${seed}" in ${algo}_seeded fixture`);
  }
  return value;
}

/**
 * Safely access an unseeded vector with descriptive error on missing data.
 */
function requireVector(vectors: HashVectors, key: string, algo: string): string {
  const value = vectors[key];
  if (value === undefined) {
    throw new Error(`Missing key "${key}" in ${algo} fixture`);
  }
  return value;
}

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

describe("Deterministic Test Vectors", () => {
  beforeAll(async () => {
    await hash.init({ wasmPath });
  });

  describe("crc32HexSync", () => {
    const vectors = testVectors.crc32 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("crc32(%s) matches expected", (name, input) => {
      const result = hash.crc32HexSync(input);
      expect(result).toBe(requireVector(vectors, name, "crc32"));
    });
  });

  describe("adler32HexSync", () => {
    const vectors = testVectors.adler32 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("adler32(%s) matches expected", (name, input) => {
      const result = hash.adler32HexSync(input);
      expect(result).toBe(requireVector(vectors, name, "adler32"));
    });
  });

  describe("xxhash32HexSync", () => {
    const vectors = testVectors.xxhash32 as HashVectors;
    const seededVectors = testVectors.xxhash32_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("xxhash32(%s) matches expected", (name, input) => {
      const result = hash.xxhash32HexSync(input);
      expect(result).toBe(requireVector(vectors, name, "xxhash32"));
    });

    it("xxhash32 with seed=0 matches unseeded", () => {
      expect(hash.xxhash32HexSync("test", 0)).toBe(requireVector(vectors, "test", "xxhash32"));
    });

    // Full matrix: all seeds x all inputs (xxhash32 uses 32-bit number seeds)
    const xxhash32Seeds = [
      ["0", 0],
      ["1", 1],
      ["42", 42],
      ["3735928559", 0xdeadbeef], // 0xDEADBEEF
    ] as const;

    it.each(
      xxhash32Seeds.flatMap(([seedKey, seedNum]) =>
        Object.entries(TEST_INPUTS).map(
          ([inputName, input]) => [seedKey, seedNum, inputName, input] as const,
        )
      ),
    )("xxhash32(seed=%s, %s) matches expected", (seedKey, seedNum, inputName, _input) => {
      const input = TEST_INPUTS[inputName];
      if (input === undefined) throw new Error(`Missing TEST_INPUT: ${inputName}`);
      const expected = requireSeededVector(seededVectors, seedKey, inputName, "xxhash32");
      expect(hash.xxhash32HexSync(input, seedNum)).toBe(expected);
    });

    it("validates string-to-number seed conversion", () => {
      const seedStr = "3735928559";
      const seedNum = Number(seedStr);
      expect(seedNum).toBe(0xdeadbeef);
      expect(Number.isInteger(seedNum)).toBe(true);
      expect(seedNum).toBeLessThanOrEqual(0xffffffff);
    });
  });

  describe("xxhash64HexSync", () => {
    const vectors = testVectors.xxhash64 as HashVectors;
    const seededVectors = testVectors.xxhash64_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("xxhash64(%s) matches expected", (name, input) => {
      const result = hash.xxhash64HexSync(input);
      expect(result).toBe(requireVector(vectors, name, "xxhash64"));
    });

    it("xxhash64 with seed=0n matches unseeded", () => {
      expect(hash.xxhash64HexSync("test", 0n)).toBe(requireVector(vectors, "test", "xxhash64"));
    });

    // Full matrix: all seeds x all inputs (xxhash64 uses 64-bit bigint seeds)
    const xxhash64Seeds = [
      ["0", 0n],
      ["1", 1n],
      ["42", 42n],
      ["16045690984503098046", 16045690984503098046n], // 0xDEADBEEFCAFEBABE
    ] as const;

    it.each(
      xxhash64Seeds.flatMap(([seedKey, seedNum]) =>
        Object.entries(TEST_INPUTS).map(
          ([inputName, input]) => [seedKey, seedNum, inputName, input] as const,
        )
      ),
    )("xxhash64(seed=%s, %s) matches expected", (seedKey, seedNum, inputName, _input) => {
      const input = TEST_INPUTS[inputName];
      if (input === undefined) throw new Error(`Missing TEST_INPUT: ${inputName}`);
      const expected = requireSeededVector(seededVectors, seedKey, inputName, "xxhash64");
      expect(hash.xxhash64HexSync(input, seedNum)).toBe(expected);
    });

    it("validates string-to-bigint seed conversion", () => {
      const seedStr = "16045690984503098046";
      const seedBigInt = BigInt(seedStr);
      expect(seedBigInt).toBe(0xdeadbeefcafebaben);
    });
  });

  describe("wyhashHexSync", () => {
    const vectors = testVectors.wyhash as HashVectors;
    const seededVectors = testVectors.wyhash_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("wyhash(%s) matches expected", (name, input) => {
      const result = hash.wyhashHexSync(input);
      expect(result).toBe(requireVector(vectors, name, "wyhash"));
    });

    it("wyhash with seed=0n matches unseeded", () => {
      expect(hash.wyhashHexSync("test", 0n)).toBe(requireVector(vectors, "test", "wyhash"));
    });

    // Full matrix: all seeds x all inputs (wyhash uses 64-bit bigint seeds)
    const wyhashSeeds = [
      ["0", 0n],
      ["1", 1n],
      ["42", 42n],
      ["16045690984503098046", 16045690984503098046n],
    ] as const;

    it.each(
      wyhashSeeds.flatMap(([seedKey, seedNum]) =>
        Object.entries(TEST_INPUTS).map(
          ([inputName, input]) => [seedKey, seedNum, inputName, input] as const,
        )
      ),
    )("wyhash(seed=%s, %s) matches expected", (seedKey, seedNum, inputName, _input) => {
      const input = TEST_INPUTS[inputName];
      if (input === undefined) throw new Error(`Missing TEST_INPUT: ${inputName}`);
      const expected = requireSeededVector(seededVectors, seedKey, inputName, "wyhash");
      expect(hash.wyhashHexSync(input, seedNum)).toBe(expected);
    });
  });

  describe("cityhash64HexSync", () => {
    const vectors = testVectors.cityhash64 as HashVectors;
    const seededVectors = testVectors.cityhash64_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("cityhash64(%s) matches expected", (name, input) => {
      const result = hash.cityhash64HexSync(input);
      expect(result).toBe(requireVector(vectors, name, "cityhash64"));
    });

    // Full matrix: all seeds x all inputs (cityhash64 uses 64-bit bigint seeds)
    const cityhash64Seeds = [
      ["0", 0n],
      ["1", 1n],
      ["42", 42n],
      ["16045690984503098046", 16045690984503098046n],
    ] as const;

    it.each(
      cityhash64Seeds.flatMap(([seedKey, seedNum]) =>
        Object.entries(TEST_INPUTS).map(
          ([inputName, input]) => [seedKey, seedNum, inputName, input] as const,
        )
      ),
    )("cityhash64(seed=%s, %s) matches expected", (seedKey, seedNum, inputName, _input) => {
      const input = TEST_INPUTS[inputName];
      if (input === undefined) throw new Error(`Missing TEST_INPUT: ${inputName}`);
      const expected = requireSeededVector(seededVectors, seedKey, inputName, "cityhash64");
      expect(hash.cityhash64HexSync(input, seedNum)).toBe(expected);
    });
  });

  describe("murmur2_64HexSync", () => {
    const vectors = testVectors.murmur2_64 as HashVectors;
    const seededVectors = testVectors.murmur2_64_seeded as SeededVectors;

    it.each(Object.entries(TEST_INPUTS))("murmur2_64(%s) matches expected", (name, input) => {
      const result = hash.murmur2_64HexSync(input);
      expect(result).toBe(requireVector(vectors, name, "murmur2_64"));
    });

    // Full matrix: all seeds x all inputs (murmur2_64 uses 64-bit bigint seeds)
    const murmur2_64Seeds = [
      ["0", 0n],
      ["1", 1n],
      ["42", 42n],
      ["16045690984503098046", 16045690984503098046n],
    ] as const;

    it.each(
      murmur2_64Seeds.flatMap(([seedKey, seedNum]) =>
        Object.entries(TEST_INPUTS).map(
          ([inputName, input]) => [seedKey, seedNum, inputName, input] as const,
        )
      ),
    )("murmur2_64(seed=%s, %s) matches expected", (seedKey, seedNum, inputName, _input) => {
      const input = TEST_INPUTS[inputName];
      if (input === undefined) throw new Error(`Missing TEST_INPUT: ${inputName}`);
      const expected = requireSeededVector(seededVectors, seedKey, inputName, "murmur2_64");
      expect(hash.murmur2_64HexSync(input, seedNum)).toBe(expected);
    });
  });

  describe("fnv1a64HexSync", () => {
    const vectors = testVectors.fnv1a64 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("fnv1a64(%s) matches expected", (name, input) => {
      const result = hash.fnv1a64HexSync(input);
      expect(result).toBe(requireVector(vectors, name, "fnv1a64"));
    });
  });

  describe("fnv1a32HexSync", () => {
    const vectors = testVectors.fnv1a32 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("fnv1a32(%s) matches expected", (name, input) => {
      const result = hash.fnv1a32HexSync(input);
      expect(result).toBe(requireVector(vectors, name, "fnv1a32"));
    });
  });
});

describe("Generic hashSync and hashHexSync", () => {
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

describe("Edge Cases", () => {
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

describe("Concurrent Initialization", () => {
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
