/**
 * Tests for sync variants and hex output functions
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import * as hash from "../src/index.ts";

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), "../dist/hash.wasm");

describe("@zig-wasm/hash - Sync Hex Variants", () => {
  beforeAll(async () => {
    await hash.init({ wasmPath });
  });

  describe("crc32HexSync", () => {
    it("returns hex string for known input", () => {
      const result = hash.crc32HexSync("123456789");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });

    it("handles empty string", () => {
      const result = hash.crc32HexSync("");
      expect(typeof result).toBe("string");
    });
  });

  describe("adler32HexSync", () => {
    it("returns correct hex for Wikipedia", () => {
      const result = hash.adler32HexSync("Wikipedia");
      expect(result).toBe("11e60398");
    });

    it("handles binary input", () => {
      const bytes = new Uint8Array([1, 2, 3, 4]);
      const result = hash.adler32HexSync(bytes);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("xxhash64HexSync", () => {
    it("returns hex string for known input", () => {
      const result = hash.xxhash64HexSync("test");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
      expect(result.replace("-", "").length).toBeLessThanOrEqual(16);
    });

    it("accepts seed parameter", () => {
      const result1 = hash.xxhash64HexSync("test", 0n);
      const result2 = hash.xxhash64HexSync("test", 1n);
      expect(result1).not.toBe(result2);
    });
  });

  describe("xxhash32HexSync", () => {
    it("returns hex string", () => {
      const result = hash.xxhash32HexSync("hello");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });

    it("accepts seed parameter", () => {
      const result1 = hash.xxhash32HexSync("test", 0);
      const result2 = hash.xxhash32HexSync("test", 42);
      expect(result1).not.toBe(result2);
    });
  });

  describe("wyhashHexSync", () => {
    it("returns hex string", () => {
      const result = hash.wyhashHexSync("test");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });

    it("accepts seed parameter", () => {
      const result1 = hash.wyhashHexSync("test", 0n);
      const result2 = hash.wyhashHexSync("test", 123n);
      expect(result1).not.toBe(result2);
    });
  });

  describe("cityhash64HexSync", () => {
    it("returns hex string", () => {
      const result = hash.cityhash64HexSync("hello world");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });

    it("accepts seed parameter", () => {
      const result1 = hash.cityhash64HexSync("test", 0n);
      const result2 = hash.cityhash64HexSync("test", 999n);
      expect(result1).not.toBe(result2);
    });
  });

  describe("murmur2_64HexSync", () => {
    it("returns hex string", () => {
      const result = hash.murmur2_64HexSync("murmur test");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });

    it("accepts seed parameter", () => {
      const result1 = hash.murmur2_64HexSync("test", 0n);
      const result2 = hash.murmur2_64HexSync("test", 0xdeadbeefn);
      expect(result1).not.toBe(result2);
    });
  });

  describe("fnv1a64HexSync", () => {
    it("returns hex string", () => {
      const result = hash.fnv1a64HexSync("fnv test");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });

    it("is deterministic", () => {
      const result1 = hash.fnv1a64HexSync("same input");
      const result2 = hash.fnv1a64HexSync("same input");
      expect(result1).toBe(result2);
    });
  });

  describe("fnv1a32HexSync", () => {
    it("returns hex string", () => {
      const result = hash.fnv1a32HexSync("fnv 32 test");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });
  });
});

describe("@zig-wasm/hash - Generic hashSync and hashHexSync", () => {
  beforeAll(async () => {
    await hash.init({ wasmPath });
  });

  describe("hashSync with 32-bit algorithms", () => {
    it("works with crc32", () => {
      const result = hash.hashSync("crc32", "test");
      expect(typeof result).toBe("number");
    });

    it("works with adler32", () => {
      const result = hash.hashSync("adler32", "test");
      expect(typeof result).toBe("number");
    });

    it("works with fnv1a32", () => {
      const result = hash.hashSync("fnv1a32", "test");
      expect(typeof result).toBe("number");
    });

    it("works with xxhash32", () => {
      const result = hash.hashSync("xxhash32", "test");
      expect(typeof result).toBe("number");
    });
  });

  describe("hashSync with 64-bit algorithms", () => {
    it("works with xxhash64", () => {
      const result = hash.hashSync("xxhash64", "test");
      expect(typeof result).toBe("bigint");
    });

    it("works with wyhash", () => {
      const result = hash.hashSync("wyhash", "test");
      expect(typeof result).toBe("bigint");
    });

    it("works with cityhash64", () => {
      const result = hash.hashSync("cityhash64", "test");
      expect(typeof result).toBe("bigint");
    });

    it("works with murmur2_64", () => {
      const result = hash.hashSync("murmur2_64", "test");
      expect(typeof result).toBe("bigint");
    });

    it("works with fnv1a64", () => {
      const result = hash.hashSync("fnv1a64", "test");
      expect(typeof result).toBe("bigint");
    });
  });

  describe("hashHexSync", () => {
    it("returns hex for 32-bit algorithm", () => {
      const result = hash.hashHexSync("crc32", "test");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });

    it("returns hex for 64-bit algorithm", () => {
      const result = hash.hashHexSync("xxhash64", "test");
      expect(result).toMatch(/^-?[0-9a-f]+$/);
    });
  });
});

describe("@zig-wasm/hash - Concurrent Initialization", () => {
  it("handles concurrent init calls safely", async () => {
    const hashModule = await import("../src/index.ts");

    const promises = [
      hashModule.init({ wasmPath }),
      hashModule.init({ wasmPath }),
      hashModule.init({ wasmPath }),
    ];

    await Promise.all(promises);

    expect(hashModule.isInitialized()).toBe(true);
    const result = hashModule.crc32Sync("test");
    expect(typeof result).toBe("number");
  });
});
