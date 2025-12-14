/**
 * Edge case tests for @zig-wasm/hash.
 *
 * Tests empty strings, binary data, Unicode, and large inputs for all algorithms.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import * as hash from "../src/index.ts";

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), "../wasm/hash.wasm");

describe("@zig-wasm/hash - Edge Cases", () => {
  beforeAll(async () => {
    await hash.init({ wasmPath });
  });

  describe("empty string handling", () => {
    it("handles empty string for all 32-bit algorithms", async () => {
      // Empty string should produce consistent, valid hashes
      const crc = await hash.crc32("");
      const adler = await hash.adler32("");
      const xxh32 = await hash.xxhash32("");
      const fnv32 = await hash.fnv1a32("");

      expect(typeof crc).toBe("number");
      expect(typeof adler).toBe("number");
      expect(typeof xxh32).toBe("number");
      expect(typeof fnv32).toBe("number");

      // Known values for empty string
      expect(crc >>> 0).toBe(0); // CRC32 of empty is 0
      expect(adler >>> 0).toBe(1); // Adler32 of empty is 1
    });

    it("handles empty string for all 64-bit algorithms", async () => {
      const xxh64 = await hash.xxhash64("");
      const wy = await hash.wyhash("");
      const city = await hash.cityhash64("");
      const murmur = await hash.murmur2_64("");
      const fnv64 = await hash.fnv1a64("");

      expect(typeof xxh64).toBe("bigint");
      expect(typeof wy).toBe("bigint");
      expect(typeof city).toBe("bigint");
      expect(typeof murmur).toBe("bigint");
      expect(typeof fnv64).toBe("bigint");
    });

    it("handles empty Uint8Array", async () => {
      const empty = new Uint8Array(0);

      const crc = await hash.crc32(empty);
      const xxh64 = await hash.xxhash64(empty);

      expect(typeof crc).toBe("number");
      expect(typeof xxh64).toBe("bigint");
    });
  });

  describe("binary data with null bytes", () => {
    it("handles data with null bytes", async () => {
      const withNulls = new Uint8Array([0, 0, 0, 1, 0, 2, 0, 0]);

      const crc = await hash.crc32(withNulls);
      const xxh64 = await hash.xxhash64(withNulls);
      const wy = await hash.wyhash(withNulls);

      expect(typeof crc).toBe("number");
      expect(typeof xxh64).toBe("bigint");
      expect(typeof wy).toBe("bigint");

      // Different data should produce different hashes
      const different = new Uint8Array([0, 0, 0, 1, 0, 3, 0, 0]);
      const diffCrc = await hash.crc32(different);
      expect(diffCrc).not.toBe(crc);
    });

    it("handles high byte values", async () => {
      const highBytes = new Uint8Array([255, 254, 253, 252, 251, 250]);

      const crc = await hash.crc32(highBytes);
      const fnv = await hash.fnv1a64(highBytes);

      expect(typeof crc).toBe("number");
      expect(typeof fnv).toBe("bigint");
    });
  });

  describe("Unicode and special characters", () => {
    const unicodeStrings = [
      "Hello 世界", // Chinese
      "Привет мир", // Russian
      "مرحبا بالعالم", // Arabic
      "שלום עולם", // Hebrew
      "こんにちは世界", // Japanese
      "안녕하세요 세계", // Korean
      "emoji 🌍🎉🔥", // Emoji
      "mixed: Hello 世界 🌍 Привет", // Mixed
    ];

    it("produces consistent hashes for Unicode strings", async () => {
      for (const str of unicodeStrings) {
        const hash1 = await hash.crc32(str);
        const hash2 = await hash.crc32(str);
        expect(hash1).toBe(hash2);
      }
    });

    it("different Unicode strings produce different hashes", async () => {
      const hashes = await Promise.all(unicodeStrings.map((s) => hash.crc32(s)));
      const unique = new Set(hashes);
      expect(unique.size).toBe(hashes.length);
    });

    it("handles surrogate pairs correctly", async () => {
      // Characters outside BMP (require surrogate pairs in UTF-16)
      const emoji = "🎉";
      const hash1 = await hash.crc32(emoji);
      const hash2 = await hash.crc32(emoji);
      expect(hash1).toBe(hash2);
    });
  });

  describe("large inputs", () => {
    it("handles 1MB input", async () => {
      const large = "x".repeat(1024 * 1024);

      const crc = await hash.crc32(large);
      const xxh64 = await hash.xxhash64(large);
      const wy = await hash.wyhash(large);

      expect(typeof crc).toBe("number");
      expect(typeof xxh64).toBe("bigint");
      expect(typeof wy).toBe("bigint");
    });

    it("handles large binary data", async () => {
      const large = new Uint8Array(100000);
      for (let i = 0; i < large.length; i++) {
        large[i] = i % 256;
      }

      const crc = await hash.crc32(large);
      const city = await hash.cityhash64(large);

      expect(typeof crc).toBe("number");
      expect(typeof city).toBe("bigint");
    });
  });

  describe("seed variations", () => {
    const testData = "test seed data";

    it("xxhash32 with various seeds", async () => {
      const seeds = [0, 1, 42, 0xffffffff, 0x12345678];
      const hashes = await Promise.all(seeds.map((s) => hash.xxhash32(testData, s)));

      // All different seeds should produce different hashes
      const unique = new Set(hashes);
      expect(unique.size).toBe(seeds.length);
    });

    it("xxhash64 with various seeds", async () => {
      const seeds = [0n, 1n, 42n, 0xffffffffffffffffn, 0x123456789abcdef0n];
      const hashes = await Promise.all(seeds.map((s) => hash.xxhash64(testData, s)));

      const unique = new Set(hashes.map((h) => h.toString()));
      expect(unique.size).toBe(seeds.length);
    });

    it("wyhash with various seeds", async () => {
      const seeds = [0n, 1n, 999n, 0xdeadbeefn];
      const hashes = await Promise.all(seeds.map((s) => hash.wyhash(testData, s)));

      const unique = new Set(hashes.map((h) => h.toString()));
      expect(unique.size).toBe(seeds.length);
    });

    it("cityhash64 with various seeds", async () => {
      const seeds = [0n, 42n, 12345678901234n];
      const hashes = await Promise.all(seeds.map((s) => hash.cityhash64(testData, s)));

      const unique = new Set(hashes.map((h) => h.toString()));
      expect(unique.size).toBe(seeds.length);
    });

    it("murmur2_64 with various seeds", async () => {
      const seeds = [0n, 1n, 0xc0ffeen];
      const hashes = await Promise.all(seeds.map((s) => hash.murmur2_64(testData, s)));

      const unique = new Set(hashes.map((h) => h.toString()));
      expect(unique.size).toBe(seeds.length);
    });
  });

  describe("generic hash API edge cases", () => {
    it("hash32 with Uint8Array", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      const crc = await hash.hash32("crc32", data);
      const adler = await hash.hash32("adler32", data);
      const xxh = await hash.hash32("xxhash32", data);
      const fnv = await hash.hash32("fnv1a32", data);

      expect(typeof crc).toBe("number");
      expect(typeof adler).toBe("number");
      expect(typeof xxh).toBe("number");
      expect(typeof fnv).toBe("number");
    });

    it("hash64 with Uint8Array", async () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      const xxh = await hash.hash64("xxhash64", data);
      const wy = await hash.hash64("wyhash", data);
      const city = await hash.hash64("cityhash64", data);
      const murmur = await hash.hash64("murmur2_64", data);
      const fnv = await hash.hash64("fnv1a64", data);

      expect(typeof xxh).toBe("bigint");
      expect(typeof wy).toBe("bigint");
      expect(typeof city).toBe("bigint");
      expect(typeof murmur).toBe("bigint");
      expect(typeof fnv).toBe("bigint");
    });

    it("hash with all algorithms", async () => {
      const data = "test all algorithms";

      // 32-bit
      expect(typeof (await hash.hash("crc32", data))).toBe("number");
      expect(typeof (await hash.hash("adler32", data))).toBe("number");
      expect(typeof (await hash.hash("xxhash32", data))).toBe("number");
      expect(typeof (await hash.hash("fnv1a32", data))).toBe("number");

      // 64-bit
      expect(typeof (await hash.hash("xxhash64", data))).toBe("bigint");
      expect(typeof (await hash.hash("wyhash", data))).toBe("bigint");
      expect(typeof (await hash.hash("cityhash64", data))).toBe("bigint");
      expect(typeof (await hash.hash("murmur2_64", data))).toBe("bigint");
      expect(typeof (await hash.hash("fnv1a64", data))).toBe("bigint");
    });

    it("hashHex with all algorithms produces valid hex", async () => {
      const data = "test hex output";

      // 32-bit (8 chars)
      const crc = await hash.hashHex("crc32", data);
      const adler = await hash.hashHex("adler32", data);
      const xxh32 = await hash.hashHex("xxhash32", data);
      const fnv32 = await hash.hashHex("fnv1a32", data);

      expect(crc).toMatch(/^[0-9a-f]{8}$/);
      expect(adler).toMatch(/^[0-9a-f]{8}$/);
      expect(xxh32).toMatch(/^[0-9a-f]{8}$/);
      expect(fnv32).toMatch(/^[0-9a-f]{8}$/);

      // 64-bit (16 chars)
      const xxh64 = await hash.hashHex("xxhash64", data);
      const wy = await hash.hashHex("wyhash", data);
      const city = await hash.hashHex("cityhash64", data);
      const murmur = await hash.hashHex("murmur2_64", data);
      const fnv64 = await hash.hashHex("fnv1a64", data);

      expect(xxh64).toMatch(/^[0-9a-f]{16}$/);
      expect(wy).toMatch(/^[0-9a-f]{16}$/);
      expect(city).toMatch(/^[0-9a-f]{16}$/);
      expect(murmur).toMatch(/^[0-9a-f]{16}$/);
      expect(fnv64).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe("sync API with Uint8Array", () => {
    it("all sync functions handle Uint8Array", () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

      expect(typeof hash.crc32Sync(data)).toBe("number");
      expect(typeof hash.adler32Sync(data)).toBe("number");
      expect(typeof hash.xxhash32Sync(data)).toBe("number");
      expect(typeof hash.fnv1a32Sync(data)).toBe("number");

      expect(typeof hash.xxhash64Sync(data)).toBe("bigint");
      expect(typeof hash.wyhashSync(data)).toBe("bigint");
      expect(typeof hash.cityhash64Sync(data)).toBe("bigint");
      expect(typeof hash.murmur2_64Sync(data)).toBe("bigint");
      expect(typeof hash.fnv1a64Sync(data)).toBe("bigint");
    });
  });

  describe("determinism", () => {
    it("produces same hash for same input across multiple calls", async () => {
      const input = "determinism test";
      const iterations = 100;

      const crcValues = await Promise.all(Array(iterations).fill(null).map(() => hash.crc32(input)));
      const uniqueCrc = new Set(crcValues);
      expect(uniqueCrc.size).toBe(1);

      const xxhValues = await Promise.all(Array(iterations).fill(null).map(() => hash.xxhash64(input)));
      const uniqueXxh = new Set(xxhValues.map((v) => v.toString()));
      expect(uniqueXxh.size).toBe(1);
    });

    it("produces same hash for string and equivalent Uint8Array", async () => {
      const str = "Hello, World!";
      const bytes = new TextEncoder().encode(str);

      expect(await hash.crc32(str)).toBe(await hash.crc32(bytes));
      expect(await hash.adler32(str)).toBe(await hash.adler32(bytes));
      expect(await hash.xxhash64(str)).toBe(await hash.xxhash64(bytes));
      expect(await hash.wyhash(str)).toBe(await hash.wyhash(bytes));
    });
  });
});
