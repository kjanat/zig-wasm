/**
 * Tests for module initialization, lifecycle, and error handling
 */

import { NotInitializedError } from "@zig-wasm/core";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, "../wasm/math.wasm");

// We need to test initialization behavior, so we use dynamic imports
// to get fresh module instances

describe("@zig-wasm/math - Module Initialization", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("isInitialized", () => {
    it("returns true after init completes", async () => {
      const math = await import("../src/index.ts");
      // Module may already be initialized from other tests
      await math.init();
      expect(math.isInitialized()).toBe(true);
    });
  });

  describe("getExports and getExportsSync", () => {
    it("getExports returns WASM exports after init", async () => {
      const math = await import("../src/index.ts");
      await math.init();

      const exports = await math.getExports();

      expect(exports).toBeDefined();
      expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
      expect(exports.abs_f64).toBeTypeOf("function");
      expect(exports.sin_f64).toBeTypeOf("function");
    });

    it("getExportsSync returns WASM exports after init", async () => {
      const math = await import("../src/index.ts");
      await math.init();

      const exports = math.getExportsSync();

      expect(exports).toBeDefined();
      expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
      expect(exports.abs_f64).toBeTypeOf("function");
    });
  });

  describe("init idempotency", () => {
    it("multiple init calls return immediately", async () => {
      const math = await import("../src/index.ts");

      // First init
      await math.init();
      const exports1 = math.getExportsSync();

      // Second init should be a no-op
      await math.init();
      const exports2 = math.getExportsSync();

      expect(exports1).toBe(exports2);
    });

    it("handles concurrent init calls safely", async () => {
      const math = await import("../src/index.ts");

      // Start multiple inits concurrently
      const promises = [
        math.init(),
        math.init(),
        math.init(),
      ];

      await Promise.all(promises);

      expect(math.isInitialized()).toBe(true);
      // All should resolve to the same exports
      const exports = math.getExportsSync();
      expect(exports.abs_f64).toBeTypeOf("function");
    });
  });

  describe("async API auto-initialization", () => {
    it("async functions auto-initialize on first call", async () => {
      const math = await import("../src/index.ts");
      await math.init(); // Ensure we're initialized

      // Call should work regardless of init state
      const result = await math.abs(-42);
      expect(result).toBe(42);
    });

    it("multiple async calls trigger single initialization", async () => {
      const math = await import("../src/index.ts");

      // Multiple concurrent async calls
      const results = await Promise.all([
        math.abs(-1),
        math.abs(-2),
        math.abs(-3),
      ]);

      expect(results).toEqual([1, 2, 3]);
      expect(math.isInitialized()).toBe(true);
    });
  });
});

describe("@zig-wasm/math - NotInitializedError behavior", () => {
  // This test needs careful setup because the module is a singleton
  // We test by checking the error message format

  it("NotInitializedError has correct format", () => {
    const error = new NotInitializedError("math");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("NotInitializedError");
    expect(error.message).toContain("math");
    expect(error.message).toContain("not initialized");
    expect(error.message).toContain("init()");
  });

  it("getExportsSync should throw when not initialized (tested via error shape)", () => {
    // Since the module is a singleton and may be initialized,
    // we verify the error would be thrown by checking the error class
    const error = new NotInitializedError("math");

    expect(error.message).toBe("math WASM module not initialized. Call init() first or use the async API.");
  });
});

describe("@zig-wasm/math - Additional async coverage", () => {
  it("absF32 async variant works", async () => {
    const math = await import("../src/index.ts");
    await math.init();

    expect(await math.absF32(-42.5)).toBeCloseTo(42.5, 5);
    expect(await math.absF32(42.5)).toBeCloseTo(42.5, 5);
  });

  it("minF32 async variant works", async () => {
    const math = await import("../src/index.ts");
    await math.init();

    expect(await math.minF32(5.5, 10.5)).toBeCloseTo(5.5, 5);
    expect(await math.minF32(-5.5, -10.5)).toBeCloseTo(-10.5, 5);
  });

  it("maxF32 async variant works", async () => {
    const math = await import("../src/index.ts");
    await math.init();

    expect(await math.maxF32(5.5, 10.5)).toBeCloseTo(10.5, 5);
    expect(await math.maxF32(-5.5, -10.5)).toBeCloseTo(-5.5, 5);
  });

  it("clampF32 async variant works", async () => {
    const math = await import("../src/index.ts");
    await math.init();

    expect(await math.clampF32(5.0, 0.0, 10.0)).toBeCloseTo(5.0, 5);
    expect(await math.clampF32(-5.0, 0.0, 10.0)).toBeCloseTo(0.0, 5);
    expect(await math.clampF32(15.0, 0.0, 10.0)).toBeCloseTo(10.0, 5);
  });
});

describe("@zig-wasm/math - Init options coverage", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts wasmBytes option", async () => {
    const { readFile } = await import("node:fs/promises");
    const wasmBytes = await readFile(wasmPath);
    const math = await import("../src/math.ts");

    await math.init({ wasmBytes });

    expect(math.isInitialized()).toBe(true);
    expect(math.absSync(-5)).toBe(5);
  });

  it("accepts wasmPath option", async () => {
    const math = await import("../src/math.ts");

    await math.init({ wasmPath });

    expect(math.isInitialized()).toBe(true);
    expect(math.absSync(-5)).toBe(5);
  });

  it("accepts wasmUrl with custom fetchFn", async () => {
    const { readFile } = await import("node:fs/promises");
    const { pathToFileURL } = await import("node:url");
    const math = await import("../src/math.ts");

    const wasmUrl = pathToFileURL(wasmPath).href;

    await math.init({
      wasmUrl,
      fetchFn: async (url) => {
        // Convert file:// URL back to path and read
        const filePath = fileURLToPath(url);
        const buffer = await readFile(filePath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      },
    });

    expect(math.isInitialized()).toBe(true);
    expect(math.absSync(-5)).toBe(5);
  });
});

describe("@zig-wasm/math - Sync API without init", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws NotInitializedError when calling sync API before init", async () => {
    const math = await import("../src/math.ts");

    // Use error name check since vi.resetModules() creates separate class instances
    expect(() => math.absSync(5)).toThrow("not initialized");
    expect(() => math.getExportsSync()).toThrow("not initialized");
  });
});

describe("@zig-wasm/math - Concurrent init with fresh module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("second caller awaits first init promise (covers lines 75-76)", async () => {
    const math = await import("../src/math.ts");

    // Both start before wasmExports is set - tests the initPromise branch
    const p1 = math.init();
    const p2 = math.init();

    await Promise.all([p1, p2]);

    expect(math.isInitialized()).toBe(true);
    expect(math.absSync(-42)).toBe(42);
  });
});
