/**
 * Tests for initialization paths and error handling in @zig-wasm/hash.
 *
 * Covers uncovered branches:
 * - Concurrent initialization (initPromise reuse)
 * - wasmBytes initialization
 * - wasmUrl initialization
 * - NotInitializedError thrown by sync functions
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), "../wasm/hash.wasm");

describe("@zig-wasm/hash - Initialization Paths", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("wasmBytes initialization", () => {
    it("initializes with wasmBytes", async () => {
      const hashModule = await import("../src/hash.ts");
      const wasmBytes = new Uint8Array(readFileSync(wasmPath));

      await hashModule.init({ wasmBytes });

      expect(hashModule.isInitialized()).toBe(true);
      const result = hashModule.crc32Sync("test");
      expect(typeof result).toBe("number");
    });

    it("supports imports option with wasmBytes", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");
      const wasmBytes = new Uint8Array(readFileSync(wasmPath));

      await hashModule.init({
        wasmBytes,
        imports: {}, // empty imports object
      });

      expect(hashModule.isInitialized()).toBe(true);
    });
  });

  describe("wasmUrl initialization", () => {
    // Note: wasmUrl with file:// doesn't work in Node due to fetch limitations
    // This branch is primarily for browser environments
    it.skip("initializes with wasmUrl (browser only)", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");
      // Would need http:// URL for this to work
      const wasmUrl = "http://localhost/hash.wasm";

      await hashModule.init({ wasmUrl });

      expect(hashModule.isInitialized()).toBe(true);
    });
  });

  describe("concurrent initialization", () => {
    it("reuses initPromise for concurrent init calls", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");

      // Start multiple init calls simultaneously
      const promise1 = hashModule.init({ wasmPath });
      const promise2 = hashModule.init({ wasmPath });
      const promise3 = hashModule.init({ wasmPath });

      // All should resolve to the same initialization
      await Promise.all([promise1, promise2, promise3]);

      expect(hashModule.isInitialized()).toBe(true);

      // Verify functional after concurrent init
      const result = hashModule.crc32Sync("concurrent test");
      expect(typeof result).toBe("number");
    });

    it("handles init called while initialization is in progress", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");

      // First call starts initialization
      const firstInit = hashModule.init({ wasmPath });

      // Second call should reuse the pending promise (covers line 104-105)
      const secondInit = hashModule.init({ wasmPath });

      await firstInit;
      await secondInit;

      expect(hashModule.isInitialized()).toBe(true);
    });
  });

  describe("NotInitializedError", () => {
    it("throws NotInitializedError when sync functions called before init", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");

      // Should throw NotInitializedError (check by name due to module isolation)
      try {
        hashModule.crc32Sync("test");
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).name).toBe("NotInitializedError");
      }
    });

    it("throws with correct module name in error", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");

      try {
        hashModule.crc32Sync("test");
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).name).toBe("NotInitializedError");
        expect((error as Error).message).toContain("hash");
      }
    });

    it("throws for all sync functions before init", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");

      // 32-bit sync functions
      expect(() => hashModule.hash32Sync("crc32", "test")).toThrowError(/not initialized/i);
      expect(() => hashModule.adler32Sync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.xxhash32Sync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.fnv1a32Sync("test")).toThrowError(/not initialized/i);

      // 64-bit sync functions
      expect(() => hashModule.hash64Sync("xxhash64", "test")).toThrowError(/not initialized/i);
      expect(() => hashModule.xxhash64Sync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.wyhashSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.cityhash64Sync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.murmur2_64Sync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.fnv1a64Sync("test")).toThrowError(/not initialized/i);

      // Generic sync functions
      expect(() => hashModule.hashSync("crc32", "test")).toThrowError(/not initialized/i);
      expect(() => hashModule.hashHexSync("crc32", "test")).toThrowError(/not initialized/i);
    });

    it("throws for hex sync functions before init", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");

      expect(() => hashModule.crc32HexSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.adler32HexSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.xxhash32HexSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.xxhash64HexSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.wyhashHexSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.cityhash64HexSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.murmur2_64HexSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.fnv1a32HexSync("test")).toThrowError(/not initialized/i);
      expect(() => hashModule.fnv1a64HexSync("test")).toThrowError(/not initialized/i);
    });
  });

  describe("idempotent initialization", () => {
    it("returns immediately if already initialized", async () => {
      vi.resetModules();
      const hashModule = await import("../src/hash.ts");

      // First initialization
      await hashModule.init({ wasmPath });
      expect(hashModule.isInitialized()).toBe(true);

      // Second call should return immediately (covers line 101)
      await hashModule.init({ wasmPath });
      expect(hashModule.isInitialized()).toBe(true);

      // Should still work
      const result = hashModule.crc32Sync("idempotent");
      expect(typeof result).toBe("number");
    });
  });
});
