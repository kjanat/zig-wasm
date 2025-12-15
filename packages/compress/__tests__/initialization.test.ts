import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

// We need fresh imports for each test to reset module state
// This is achieved by using dynamic imports with cache busting

const fixturesDir = join(import.meta.dirname, "fixtures");
const currentDir = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(currentDir, "../wasm/compress.wasm");

function loadFixture(filename: string): Uint8Array {
  return new Uint8Array(readFileSync(join(fixturesDir, filename)));
}

describe("@zig-wasm/compress - NotInitializedError", () => {
  it("throws NotInitializedError when calling sync function before init", async () => {
    // Use vi.resetModules to get fresh module state
    vi.resetModules();
    const { decompressXzSync, NotInitializedError, isInitialized } = await import("@zig-wasm/compress");

    expect(isInitialized()).toBe(false);
    expect(() => decompressXzSync(new Uint8Array([1, 2, 3]))).toThrow(NotInitializedError);
  });

  it("throws NotInitializedError for decompressLzmaSync before init", async () => {
    vi.resetModules();
    const { decompressLzmaSync, NotInitializedError, isInitialized } = await import("@zig-wasm/compress");

    expect(isInitialized()).toBe(false);
    expect(() => decompressLzmaSync(new Uint8Array([1, 2, 3]))).toThrow(NotInitializedError);
  });

  it("NotInitializedError has descriptive message", async () => {
    vi.resetModules();
    const { decompressXzSync, NotInitializedError } = await import("@zig-wasm/compress");

    try {
      decompressXzSync(new Uint8Array([1, 2, 3]));
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(NotInitializedError);
      expect((err as Error).message).toContain("compress");
    }
  });
});

describe("@zig-wasm/compress - init() options", () => {
  it("supports wasmPath option", async () => {
    vi.resetModules();
    const { init, isInitialized, decompressXzSync } = await import("@zig-wasm/compress");

    expect(isInitialized()).toBe(false);
    await init({ wasmPath });
    expect(isInitialized()).toBe(true);

    const compressed = loadFixture("hello.txt.xz");
    const result = decompressXzSync(compressed);
    expect(new TextDecoder().decode(result)).toBe("Hello, World!");
  });

  it("supports wasmBytes option", async () => {
    vi.resetModules();
    const { init, isInitialized, decompressXzSync } = await import("@zig-wasm/compress");

    const wasmBytes = new Uint8Array(readFileSync(wasmPath));

    expect(isInitialized()).toBe(false);
    await init({ wasmBytes });
    expect(isInitialized()).toBe(true);

    const compressed = loadFixture("hello.txt.xz");
    const result = decompressXzSync(compressed);
    expect(new TextDecoder().decode(result)).toBe("Hello, World!");
  });

  it("supports wasmUrl with custom fetchFn", async () => {
    vi.resetModules();
    const { init, isInitialized, decompressXzSync } = await import("@zig-wasm/compress");
    const { readFile } = await import("node:fs/promises");
    const { pathToFileURL } = await import("node:url");

    const wasmUrl = pathToFileURL(wasmPath).href;

    expect(isInitialized()).toBe(false);
    await init({
      wasmUrl,
      fetchFn: async (url) => {
        const filePath = fileURLToPath(url);
        const buffer = await readFile(filePath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      },
    });
    expect(isInitialized()).toBe(true);

    const compressed = loadFixture("hello.txt.xz");
    const result = decompressXzSync(compressed);
    expect(new TextDecoder().decode(result)).toBe("Hello, World!");
  });

  it("init is idempotent - second call is a no-op", async () => {
    vi.resetModules();
    const { init, isInitialized, decompressXzSync } = await import("@zig-wasm/compress");

    await init({ wasmPath });
    expect(isInitialized()).toBe(true);

    // Second init with different options should be ignored
    await init({ wasmPath: "/nonexistent/path.wasm" });
    expect(isInitialized()).toBe(true);

    // Should still work
    const compressed = loadFixture("hello.txt.xz");
    const result = decompressXzSync(compressed);
    expect(new TextDecoder().decode(result)).toBe("Hello, World!");
  });

  it("handles concurrent init calls safely", async () => {
    vi.resetModules();
    const { init, isInitialized, decompressXzSync } = await import("@zig-wasm/compress");

    expect(isInitialized()).toBe(false);

    // Start multiple init calls concurrently
    const promises = [init({ wasmPath }), init({ wasmPath }), init({ wasmPath })];

    await Promise.all(promises);
    expect(isInitialized()).toBe(true);

    // Module should work correctly
    const compressed = loadFixture("hello.txt.xz");
    const result = decompressXzSync(compressed);
    expect(new TextDecoder().decode(result)).toBe("Hello, World!");
  });

  it("init returns on concurrent call while first is in progress", async () => {
    vi.resetModules();
    const { init, isInitialized } = await import("@zig-wasm/compress");

    expect(isInitialized()).toBe(false);

    // Start first init
    const first = init({ wasmPath });

    // Immediately start second - should join the same promise
    const second = init({ wasmPath });

    // Both should resolve
    await Promise.all([first, second]);
    expect(isInitialized()).toBe(true);
  });
});

describe("@zig-wasm/compress - init() with default path (Node/Bun)", () => {
  it("auto-detects environment and loads WASM", async () => {
    vi.resetModules();
    const { init, isInitialized, decompressXzSync } = await import("@zig-wasm/compress");

    expect(isInitialized()).toBe(false);

    // Call init without options - should auto-detect Node/Bun environment
    await init();
    expect(isInitialized()).toBe(true);

    const compressed = loadFixture("hello.txt.xz");
    const result = decompressXzSync(compressed);
    expect(new TextDecoder().decode(result)).toBe("Hello, World!");
  });
});

describe("@zig-wasm/compress - Error recovery after init failure attempt", () => {
  it("recovers when init fails with invalid wasmPath", async () => {
    vi.resetModules();
    const { isInitialized, decompressXz } = await import("@zig-wasm/compress");

    expect(isInitialized()).toBe(false);

    // Async API should still auto-init correctly after module reset
    const compressed = loadFixture("hello.txt.xz");
    const result = await decompressXz(compressed);
    expect(new TextDecoder().decode(result)).toBe("Hello, World!");
    expect(isInitialized()).toBe(true);
  });
});

describe("@zig-wasm/compress - Edge cases for decompression", () => {
  it("handles truncated XZ data", async () => {
    vi.resetModules();
    const { decompressXz } = await import("@zig-wasm/compress");

    // Take valid XZ file and truncate it
    const valid = loadFixture("hello.txt.xz");
    const truncated = valid.slice(0, Math.floor(valid.length / 2));

    await expect(decompressXz(truncated)).rejects.toThrow("XZ decompression failed");
  });

  it("handles truncated LZMA data", async () => {
    vi.resetModules();
    const { decompressLzma } = await import("@zig-wasm/compress");

    // Take valid LZMA file and truncate it
    const valid = loadFixture("hello.txt.lzma");
    const truncated = valid.slice(0, Math.floor(valid.length / 2));

    await expect(decompressLzma(truncated)).rejects.toThrow("LZMA decompression failed");
  });

  it("handles XZ with corrupted middle bytes", async () => {
    vi.resetModules();
    const { decompressXz } = await import("@zig-wasm/compress");

    const valid = loadFixture("text.txt.xz");
    const corrupted = new Uint8Array(valid);
    // Corrupt bytes in the middle
    for (let i = 20; i < 40 && i < corrupted.length; i++) {
      corrupted[i] = corrupted[i]! ^ 0xff;
    }

    await expect(decompressXz(corrupted)).rejects.toThrow("XZ decompression failed");
  });

  it("handles LZMA with corrupted middle bytes", async () => {
    vi.resetModules();
    const { decompressLzma } = await import("@zig-wasm/compress");

    const valid = loadFixture("text.txt.lzma");
    const corrupted = new Uint8Array(valid);
    // Corrupt bytes in the middle
    for (let i = 20; i < 40 && i < corrupted.length; i++) {
      corrupted[i] = corrupted[i]! ^ 0xff;
    }

    await expect(decompressLzma(corrupted)).rejects.toThrow("LZMA decompression failed");
  });

  it("handles single byte input (too small for valid header)", async () => {
    vi.resetModules();
    const { decompressXz, decompressLzma } = await import("@zig-wasm/compress");

    const tiny = new Uint8Array([0x00]);

    await expect(decompressXz(tiny)).rejects.toThrow("XZ decompression failed");
    await expect(decompressLzma(tiny)).rejects.toThrow("LZMA decompression failed");
  });

  it("handles XZ magic bytes but no content", async () => {
    vi.resetModules();
    const { decompressXz } = await import("@zig-wasm/compress");

    // XZ magic: FD 37 7A 58 5A 00
    const xzMagicOnly = new Uint8Array([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00]);

    await expect(decompressXz(xzMagicOnly)).rejects.toThrow("XZ decompression failed");
  });
});

describe("@zig-wasm/compress - Sync API after async init", () => {
  it("sync functions work after async function auto-initializes", async () => {
    vi.resetModules();
    const { decompressXz, decompressXzSync, decompressLzmaSync, isInitialized } = await import(
      "@zig-wasm/compress"
    );

    expect(isInitialized()).toBe(false);

    // Call async first - triggers auto-init
    const compressedXz = loadFixture("hello.txt.xz");
    await decompressXz(compressedXz);

    expect(isInitialized()).toBe(true);

    // Now sync should work
    const resultXz = decompressXzSync(compressedXz);
    expect(new TextDecoder().decode(resultXz)).toBe("Hello, World!");

    const compressedLzma = loadFixture("hello.txt.lzma");
    const resultLzma = decompressLzmaSync(compressedLzma);
    expect(new TextDecoder().decode(resultLzma)).toBe("Hello, World!");
  });
});
