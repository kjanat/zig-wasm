/**
 * Tests for initialization paths and error handling in @zig-wasm/hash.
 *
 * Covers uncovered branches:
 * - Concurrent initialization (initPromise reuse)
 * - wasmBytes initialization
 * - wasmUrl initialization
 * - NotInitializedError thrown by sync functions
 */

import { NotInitializedError } from "@zig-wasm/core";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), "../wasm/hash.wasm");

describe("Initialization Paths", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("wasmBytes initialization", () => {
    it("initializes with wasmBytes", async () => {
      const hashModule = await import("@zig-wasm/hash");
      const wasmBytes = new Uint8Array(readFileSync(wasmPath));

      await hashModule.init({ wasmBytes });

      expect(hashModule.isInitialized()).toBe(true);
      const result = hashModule.crc32Sync("test");
      expect(typeof result).toBe("number");
    });

    it("supports imports option with wasmBytes", async () => {
      vi.resetModules();
      const hashModule = await import("@zig-wasm/hash");
      const wasmBytes = new Uint8Array(readFileSync(wasmPath));

      await hashModule.init({
        wasmBytes,
        imports: {}, // empty imports object
      });

      expect(hashModule.isInitialized()).toBe(true);
    });
  });

  describe("wasmUrl initialization", () => {
    it("initializes with wasmUrl and custom fetchFn", async () => {
      vi.resetModules();
      const { readFile } = await import("node:fs/promises");
      const { pathToFileURL } = await import("node:url");
      const hashModule = await import("@zig-wasm/hash");

      const wasmUrl = pathToFileURL(wasmPath).href;

      await hashModule.init({
        wasmUrl,
        fetchFn: async (url) => {
          const filePath = fileURLToPath(url);
          const buffer = await readFile(filePath);
          return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        },
      });

      expect(hashModule.isInitialized()).toBe(true);
      const result = hashModule.crc32Sync("test");
      expect(typeof result).toBe("number");
    });
  });

  describe("concurrent initialization", () => {
    it("reuses initPromise for concurrent init calls", async () => {
      vi.resetModules();
      const hashModule = await import("@zig-wasm/hash");

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
      const hashModule = await import("@zig-wasm/hash");

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
    // Helper to check error name matches imported class (avoids instanceof issues across module boundaries)
    const expectNotInitializedError = (fn: () => void) => {
      try {
        fn();
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).name).toBe(NotInitializedError.name);
      }
    };

    it("throws NotInitializedError when sync functions called before init", async () => {
      vi.resetModules();
      const hashModule = await import("@zig-wasm/hash");

      expectNotInitializedError(() => hashModule.crc32Sync("test"));
    });

    it("throws with correct module name in error", async () => {
      vi.resetModules();
      const hashModule = await import("@zig-wasm/hash");

      try {
        hashModule.crc32Sync("test");
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).name).toBe(NotInitializedError.name);
        expect((error as Error).message).toContain("hash");
      }
    });

    it("throws for all sync functions before init", async () => {
      vi.resetModules();
      const hashModule = await import("@zig-wasm/hash");

      // 32-bit sync functions
      expectNotInitializedError(() => hashModule.hash32Sync("crc32", "test"));
      expectNotInitializedError(() => hashModule.adler32Sync("test"));
      expectNotInitializedError(() => hashModule.xxhash32Sync("test"));
      expectNotInitializedError(() => hashModule.fnv1a32Sync("test"));

      // 64-bit sync functions
      expectNotInitializedError(() => hashModule.hash64Sync("xxhash64", "test"));
      expectNotInitializedError(() => hashModule.xxhash64Sync("test"));
      expectNotInitializedError(() => hashModule.wyhashSync("test"));
      expectNotInitializedError(() => hashModule.cityhash64Sync("test"));
      expectNotInitializedError(() => hashModule.murmur2_64Sync("test"));
      expectNotInitializedError(() => hashModule.fnv1a64Sync("test"));

      // Generic sync functions
      expectNotInitializedError(() => hashModule.hashSync("crc32", "test"));
      expectNotInitializedError(() => hashModule.hashHexSync("crc32", "test"));
    });

    it("throws for hex sync functions before init", async () => {
      vi.resetModules();
      const hashModule = await import("@zig-wasm/hash");

      expectNotInitializedError(() => hashModule.crc32HexSync("test"));
      expectNotInitializedError(() => hashModule.adler32HexSync("test"));
      expectNotInitializedError(() => hashModule.xxhash32HexSync("test"));
      expectNotInitializedError(() => hashModule.xxhash64HexSync("test"));
      expectNotInitializedError(() => hashModule.wyhashHexSync("test"));
      expectNotInitializedError(() => hashModule.cityhash64HexSync("test"));
      expectNotInitializedError(() => hashModule.murmur2_64HexSync("test"));
      expectNotInitializedError(() => hashModule.fnv1a32HexSync("test"));
      expectNotInitializedError(() => hashModule.fnv1a64HexSync("test"));
    });
  });

  describe("idempotent initialization", () => {
    it("returns immediately if already initialized", async () => {
      vi.resetModules();
      const hashModule = await import("@zig-wasm/hash");

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
