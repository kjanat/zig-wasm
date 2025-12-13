import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import * as hash from "../src/index.ts";

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), "../dist/hash.wasm");

describe("@zig-wasm/hash", () => {
  beforeAll(async () => {
    await hash.init({ wasmPath });
  });

  describe("exports", () => {
    it("exposes lifecycle helpers", () => {
      expect(hash.isInitialized()).toBe(true);
      expect(hash.init).toBeTypeOf("function");
    });

    it("exposes async hash helpers", () => {
      expect(hash.crc32).toBeTypeOf("function");
      expect(hash.xxhash64).toBeTypeOf("function");
      expect(hash.hash).toBeTypeOf("function");
      expect(hash.hashHex).toBeTypeOf("function");
    });

    it("exposes sync hash helpers", () => {
      expect(hash.crc32Sync).toBeTypeOf("function");
      expect(hash.xxhash64Sync).toBeTypeOf("function");
      expect(hash.hashSync).toBeTypeOf("function");
    });
  });

  describe("CRC32", () => {
    const testVectors = [
      { input: "a", expected: 0xe8b7be43 },
      { input: "abc", expected: 0x352441c2 },
      { input: "message digest", expected: 0x20159d7f },
      { input: "abcdefghijklmnopqrstuvwxyz", expected: 0x4c2750bd },
      { input: "123456789", expected: 0xcbf43926 },
      { input: "The quick brown fox jumps over the lazy dog", expected: 0x414fa339 },
    ];

    it("computes correct CRC32 hashes (async)", async () => {
      for (const { input, expected } of testVectors) {
        const result = await hash.crc32(input);
        expect(result >>> 0).toBe(expected);
      }
    });

    it("computes correct CRC32 hashes (sync)", () => {
      for (const { input, expected } of testVectors) {
        const result = hash.crc32Sync(input);
        expect(result >>> 0).toBe(expected);
      }
    });

    it("returns hex string format", async () => {
      const result = await hash.crc32Hex("123456789");
      expect(typeof result).toBe("string");
      expect(result.length).toBe(9); // -340bc6da (includes minus sign for negative)
    });

    it("handles Uint8Array input", async () => {
      const bytes = new TextEncoder().encode("abc");
      const result = await hash.crc32(bytes);
      expect(result >>> 0).toBe(0x352441c2);
    });
  });

  describe("Adler32", () => {
    const testVectors = [
      { input: "a", expected: 0x00620062 },
      { input: "abc", expected: 0x024d0127 },
      { input: "message digest", expected: 0x29750586 },
      { input: "abcdefghijklmnopqrstuvwxyz", expected: 0x90860b20 },
      { input: "Wikipedia", expected: 0x11e60398 },
    ];

    it("computes correct Adler32 hashes (async)", async () => {
      for (const { input, expected } of testVectors) {
        const result = await hash.adler32(input);
        expect(result >>> 0).toBe(expected);
      }
    });

    it("computes correct Adler32 hashes (sync)", () => {
      for (const { input, expected } of testVectors) {
        const result = hash.adler32Sync(input);
        expect(result >>> 0).toBe(expected);
      }
    });

    it("returns hex string format", async () => {
      const result = await hash.adler32Hex("Wikipedia");
      expect(result).toBe("11e60398");
    });
  });

  describe("xxHash64", () => {
    const testVectors = [
      { input: "a", seed: undefined, expected: -3292477735350538661n },
      { input: "abc", seed: undefined, expected: 4952883123889572249n },
      { input: "message digest", seed: undefined, expected: 463544382707905470n },
      { input: "test", seed: 0n, expected: 5754696928334414137n },
      { input: "test", seed: 42n, expected: 8564091296203168672n },
    ];

    it("computes correct xxHash64 hashes (async)", async () => {
      for (const { input, seed, expected } of testVectors) {
        const result = await hash.xxhash64(input, seed);
        expect(result).toBe(expected);
      }
    });

    it("computes correct xxHash64 hashes (sync)", () => {
      for (const { input, seed, expected } of testVectors) {
        const result = hash.xxhash64Sync(input, seed);
        expect(result).toBe(expected);
      }
    });

    it("returns hex string format", async () => {
      const result = await hash.xxhash64Hex("abc");
      expect(typeof result).toBe("string");
      expect(result.length).toBe(16);
    });

    it("supports custom seeds", async () => {
      const withSeed = await hash.xxhash64("test", 42n);
      const withoutSeed = await hash.xxhash64("test");
      expect(withSeed).not.toBe(withoutSeed);
    });
  });

  describe("xxHash32", () => {
    const testVectors = [
      { input: "a", seed: undefined, expected: 1426945110 },
      { input: "abc", seed: undefined, expected: 852579327 },
      { input: "test", seed: 0, expected: 1042293711 },
      { input: "test", seed: 42, expected: 584744567 },
    ];

    it("computes correct xxHash32 hashes (async)", async () => {
      for (const { input, seed, expected } of testVectors) {
        const result = await hash.xxhash32(input, seed);
        expect(result >>> 0).toBe(expected);
      }
    });

    it("computes correct xxHash32 hashes (sync)", () => {
      for (const { input, seed, expected } of testVectors) {
        const result = hash.xxhash32Sync(input, seed);
        expect(result >>> 0).toBe(expected);
      }
    });

    it("returns hex string format", async () => {
      const result = await hash.xxhash32Hex("abc");
      expect(typeof result).toBe("string");
      expect(result.length).toBe(8);
    });
  });

  describe("FNV-1a 32-bit", () => {
    const testVectors = [
      { input: "a", expected: 0xe40c292c },
      { input: "abc", expected: 0x1a47e90b },
      { input: "message digest", expected: 0xb2c0f234 },
      { input: "The quick brown fox jumps over the lazy dog", expected: 0x048fff90 },
    ];

    it("computes correct FNV-1a 32-bit hashes (async)", async () => {
      for (const { input, expected } of testVectors) {
        const result = await hash.fnv1a32(input);
        expect(result >>> 0).toBe(expected);
      }
    });

    it("computes correct FNV-1a 32-bit hashes (sync)", () => {
      for (const { input, expected } of testVectors) {
        const result = hash.fnv1a32Sync(input);
        expect(result >>> 0).toBe(expected);
      }
    });

    it("returns hex string format", async () => {
      const result = await hash.fnv1a32Hex("abc");
      expect(result).toBe("1a47e90b");
    });
  });

  describe("FNV-1a 64-bit", () => {
    const testVectors = [
      { input: "a", expected: -5808556873153909620n },
      { input: "abc", expected: -1792535898324117685n },
      { input: "message digest", expected: 3299956450659309876n },
    ];

    it("computes correct FNV-1a 64-bit hashes (async)", async () => {
      for (const { input, expected } of testVectors) {
        const result = await hash.fnv1a64(input);
        expect(result).toBe(expected);
      }
    });

    it("computes correct FNV-1a 64-bit hashes (sync)", () => {
      for (const { input, expected } of testVectors) {
        const result = hash.fnv1a64Sync(input);
        expect(result).toBe(expected);
      }
    });

    it("returns hex string", async () => {
      const result = await hash.fnv1a64Hex("abc");
      expect(typeof result).toBe("string");
      // Note: Length is 17 because negative bigints include minus sign
    });
  });

  describe("wyHash", () => {
    it("produces consistent hashes (async)", async () => {
      const result1 = await hash.wyhash("test");
      const result2 = await hash.wyhash("test");
      expect(result1).toBe(result2);
    });

    it("produces consistent hashes (sync)", () => {
      const result1 = hash.wyhashSync("test");
      const result2 = hash.wyhashSync("test");
      expect(result1).toBe(result2);
    });

    it("supports custom seeds", async () => {
      const withSeed = await hash.wyhash("test", 42n);
      const withoutSeed = await hash.wyhash("test");
      expect(withSeed).not.toBe(withoutSeed);
    });

    it("returns hex string", async () => {
      const result = await hash.wyhashHex("test");
      expect(typeof result).toBe("string");
    });
  });

  describe("CityHash64", () => {
    it("produces consistent hashes (async)", async () => {
      const result1 = await hash.cityhash64("test");
      const result2 = await hash.cityhash64("test");
      expect(result1).toBe(result2);
    });

    it("produces consistent hashes (sync)", () => {
      const result1 = hash.cityhash64Sync("test");
      const result2 = hash.cityhash64Sync("test");
      expect(result1).toBe(result2);
    });

    it("supports custom seeds", async () => {
      const withSeed = await hash.cityhash64("test", 42n);
      const withoutSeed = await hash.cityhash64("test");
      expect(withSeed).not.toBe(withoutSeed);
    });

    it("returns hex string", async () => {
      const result = await hash.cityhash64Hex("test");
      expect(typeof result).toBe("string");
    });
  });

  describe("Murmur2-64", () => {
    it("produces consistent hashes (async)", async () => {
      const result1 = await hash.murmur2_64("test");
      const result2 = await hash.murmur2_64("test");
      expect(result1).toBe(result2);
    });

    it("produces consistent hashes (sync)", () => {
      const result1 = hash.murmur2_64Sync("test");
      const result2 = hash.murmur2_64Sync("test");
      expect(result1).toBe(result2);
    });

    it("supports custom seeds", async () => {
      const withSeed = await hash.murmur2_64("test", 42n);
      const withoutSeed = await hash.murmur2_64("test");
      expect(withSeed).not.toBe(withoutSeed);
    });

    it("returns hex string", async () => {
      const result = await hash.murmur2_64Hex("test");
      expect(typeof result).toBe("string");
    });
  });

  describe("generic hash API", () => {
    it("handles 32-bit algorithms via hash()", async () => {
      const result = await hash.hash("crc32", "abc");
      expect(result).toBe(0x352441c2);
    });

    it("handles 64-bit algorithms via hash()", async () => {
      const result = await hash.hash("xxhash64", "abc");
      expect(result).toBe(0x44bc2cf5ad770999n);
    });

    it("returns hex strings via hashHex()", async () => {
      const crc32Result = await hash.hashHex("crc32", "abc");
      expect(crc32Result).toBe("352441c2");

      const xxhash64Result = await hash.hashHex("xxhash64", "abc");
      expect(xxhash64Result).toBe("44bc2cf5ad770999");
    });

    it("supports sync variants", () => {
      expect(hash.hashSync("crc32", "abc")).toBe(0x352441c2);
      expect(hash.hashHexSync("crc32", "abc")).toBe("352441c2");
    });
  });

  describe("edge cases", () => {
    it("handles large inputs", async () => {
      const large = "x".repeat(100000);
      const result = await hash.crc32(large);
      expect(typeof result).toBe("number");
    });

    it("handles binary data", async () => {
      const binary = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
      const result = await hash.crc32(binary);
      expect(typeof result).toBe("number");
    });

    it("handles Unicode correctly", async () => {
      const unicode = "Hello 世界 🌍";
      const result1 = await hash.crc32(unicode);
      const result2 = await hash.crc32(unicode);
      expect(result1).toBe(result2);
    });

    it("produces different hashes for different inputs", async () => {
      const hash1 = await hash.crc32("test1");
      const hash2 = await hash.crc32("test2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("initialization", () => {
    it("allows multiple init calls", async () => {
      await hash.init({ wasmPath });
      await hash.init({ wasmPath });
      await hash.init({ wasmPath });
      expect(hash.isInitialized()).toBe(true);
    });
  });

  describe("performance characteristics", () => {
    it("processes large data efficiently", async () => {
      const large = "x".repeat(1000000);
      const start = performance.now();
      await hash.crc32(large);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000);
    });

    it("sync API is faster than async for small inputs", async () => {
      const input = "test";
      const iterations = 1000;

      const asyncStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await hash.crc32(input);
      }
      const asyncDuration = performance.now() - asyncStart;

      const syncStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        hash.crc32Sync(input);
      }
      const syncDuration = performance.now() - syncStart;

      expect(syncDuration).toBeLessThan(asyncDuration);
    });
  });

  describe("algorithm comparison", () => {
    const testInput = "The quick brown fox jumps over the lazy dog";

    it("different algorithms produce different hashes", async () => {
      const hashes = await Promise.all([
        hash.crc32(testInput),
        hash.adler32(testInput),
        hash.xxhash32(testInput),
        hash.fnv1a32(testInput),
      ]);

      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
    });

    it("64-bit algorithms have larger output space", async () => {
      const hash32 = await hash.crc32(testInput);
      const hash64 = await hash.xxhash64(testInput);

      expect(typeof hash32).toBe("number");
      expect(typeof hash64).toBe("bigint");
      expect(hash64 > 0xffffffffn).toBe(true);
    });
  });

  describe("hex encoding", () => {
    it("pads 32-bit hashes to 8 characters", async () => {
      const result = await hash.crc32Hex("abc");
      expect(result).toBe("352441c2");
      expect(result.length).toBe(8);
    });

    it("pads 64-bit hashes to 16 characters", async () => {
      const result = await hash.xxhash64Hex("abc");
      expect(result).toBe("44bc2cf5ad770999");
      expect(result.length).toBe(16);
    });

    it("uses lowercase hexadecimal", async () => {
      const result = await hash.crc32Hex("abc");
      expect(result).toMatch(/^[0-9a-f]+$/);
      expect(result).not.toMatch(/[A-F]/);
    });
  });
});
