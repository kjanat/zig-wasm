/**
 * Tests for base64 module initialization, lifecycle, and sync API error handling
 */

import { NotInitializedError } from "@zig-wasm/core";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, "../wasm/base64.wasm");

describe("Concurrent Initialization", () => {
  it("handles concurrent init calls safely", async () => {
    const base64 = await import("@zig-wasm/base64");

    // Start multiple inits concurrently
    const promises = [
      base64.init(),
      base64.init(),
      base64.init(),
    ];

    await Promise.all(promises);

    expect(base64.isInitialized()).toBe(true);
    // All should resolve without error
    const result = base64.encodeSync("test");
    expect(result).toBe("dGVzdA==");
  });

  it("multiple async operations trigger single initialization", async () => {
    const base64 = await import("@zig-wasm/base64");

    // Multiple concurrent async calls
    const results = await Promise.all([
      base64.encode("a"),
      base64.encode("b"),
      base64.encode("c"),
    ]);

    expect(results).toEqual(["YQ==", "Yg==", "Yw=="]);
    expect(base64.isInitialized()).toBe(true);
  });
});

describe("NotInitializedError behavior", () => {
  it("NotInitializedError has correct format", () => {
    const error = new NotInitializedError("base64");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("NotInitializedError");
    expect(error.message).toContain("base64");
    expect(error.message).toContain("not initialized");
    expect(error.message).toContain("init()");
  });
});

describe("Sync decode variants", () => {
  it("decodeSync works correctly", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const result = base64.decodeSync("aGVsbG8=");
    expect(new TextDecoder().decode(result)).toBe("hello");
  });

  it("async decode works correctly", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const result = await base64.decode("aGVsbG8=");
    expect(new TextDecoder().decode(result)).toBe("hello");
  });

  it("decodeNoPaddingSync works correctly", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const result = base64.decodeNoPaddingSync("YWJj");
    expect(new TextDecoder().decode(result)).toBe("abc");
  });

  it("decodeUrlSync works correctly", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const result = base64.decodeUrlSync("dGVzdA==");
    expect(new TextDecoder().decode(result)).toBe("test");
  });

  it("decodeUrlNoPaddingSync works correctly", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const result = base64.decodeUrlNoPaddingSync("dGVzdA");
    expect(new TextDecoder().decode(result)).toBe("test");
  });
});

describe("Init options coverage", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts wasmBytes option", async () => {
    const { readFile } = await import("node:fs/promises");
    const wasmBytes = await readFile(wasmPath);
    const base64 = await import("@zig-wasm/base64");

    await base64.init({ wasmBytes });

    expect(base64.isInitialized()).toBe(true);
    expect(base64.encodeSync("test")).toBe("dGVzdA==");
  });

  it("accepts wasmPath option", async () => {
    const base64 = await import("@zig-wasm/base64");

    await base64.init({ wasmPath });

    expect(base64.isInitialized()).toBe(true);
    expect(base64.encodeSync("test")).toBe("dGVzdA==");
  });

  it("accepts wasmUrl with custom fetchFn", async () => {
    const { readFile } = await import("node:fs/promises");
    const base64 = await import("@zig-wasm/base64");

    const wasmUrl = pathToFileURL(wasmPath).href;

    await base64.init({
      wasmUrl,
      fetchFn: async (url) => {
        const filePath = fileURLToPath(url);
        const buffer = await readFile(filePath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      },
    });

    expect(base64.isInitialized()).toBe(true);
    expect(base64.encodeSync("test")).toBe("dGVzdA==");
  });
});

describe("Sync API without init", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws NotInitializedError when calling sync API before init", async () => {
    const base64 = await import("@zig-wasm/base64");

    expect(() => base64.encodeSync("test")).toThrow("not initialized");
    expect(() => base64.decodeSync("dGVzdA==")).toThrow("not initialized");
  });
});

describe("Concurrent init with fresh module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("second caller awaits first init promise", async () => {
    const base64 = await import("@zig-wasm/base64");

    const p1 = base64.init();
    const p2 = base64.init();

    await Promise.all([p1, p2]);

    expect(base64.isInitialized()).toBe(true);
    expect(base64.encodeSync("test")).toBe("dGVzdA==");
  });
});

describe("Additional sync encode coverage", () => {
  it("encodeSync with Uint8Array input", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const bytes = new Uint8Array([0, 1, 2, 255, 254, 253]);
    const result = base64.encodeSync(bytes);
    expect(result).toBe("AAEC//79");
  });

  it("encodeNoPaddingSync with Uint8Array input", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const result = base64.encodeNoPaddingSync(new Uint8Array([1, 2]));
    expect(result).not.toContain("=");
    expect(result).toMatch(/^[A-Za-z0-9+/]+$/);
  });

  it("encodeUrlSync with Uint8Array input", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    // Bytes that produce + or / in standard base64
    const bytes = new Uint8Array([251, 239, 255]);
    const result = base64.encodeUrlSync(bytes);
    expect(result).not.toMatch(/[+/]/);
    expect(result).toMatch(/^[A-Za-z0-9_-]+[=]*$/);
  });

  it("encodeUrlNoPaddingSync with Uint8Array input", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const bytes = new Uint8Array([251, 239]);
    const result = base64.encodeUrlNoPaddingSync(bytes);
    expect(result).not.toContain("=");
    expect(result).not.toMatch(/[+/]/);
  });

  it("hexEncodeSync with Uint8Array input", async () => {
    const base64 = await import("@zig-wasm/base64");
    await base64.init();

    const bytes = new Uint8Array([0, 15, 255, 128]);
    const result = base64.hexEncodeSync(bytes);
    expect(result).toBe("000fff80");
  });
});
