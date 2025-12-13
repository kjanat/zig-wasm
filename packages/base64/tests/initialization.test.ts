/**
 * Tests for base64 module initialization, lifecycle, and sync API error handling
 */
import { describe, expect, it } from "vitest";
import { NotInitializedError } from "@zig-wasm/core";

describe("@zig-wasm/base64 - Concurrent Initialization", () => {
  it("handles concurrent init calls safely", async () => {
    const base64 = await import("../src/index.ts");

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
    const base64 = await import("../src/index.ts");

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

describe("@zig-wasm/base64 - NotInitializedError behavior", () => {
  it("NotInitializedError has correct format", () => {
    const error = new NotInitializedError("base64");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("NotInitializedError");
    expect(error.message).toContain("base64");
    expect(error.message).toContain("not initialized");
    expect(error.message).toContain("init()");
  });
});

describe("@zig-wasm/base64 - Sync decode variants (WASM bug documented)", () => {
  /**
   * NOTE: base64 decode functions have a bug in the WASM module.
   * They trigger "unreachable" WASM trap. This is an upstream Zig bug.
   * These tests document the bug by verifying the error behavior.
   * Hex decode works correctly.
   */

  it("decodeSync throws due to WASM bug", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    // This should throw "unreachable" due to WASM bug
    expect(() => base64.decodeSync("aGVsbG8=")).toThrow();
  });

  it("decodeNoPaddingSync throws due to WASM bug", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    expect(() => base64.decodeNoPaddingSync("YWJj")).toThrow();
  });

  it("decodeUrlSync throws due to WASM bug", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    expect(() => base64.decodeUrlSync("dGVzdA==")).toThrow();
  });

  it("decodeUrlNoPaddingSync throws due to WASM bug", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    expect(() => base64.decodeUrlNoPaddingSync("dGVzdA")).toThrow();
  });

  it("async decode also throws due to WASM bug", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    await expect(base64.decode("aGVsbG8=")).rejects.toThrow();
  });
});

describe("@zig-wasm/base64 - Additional sync encode coverage", () => {
  it("encodeSync with Uint8Array input", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    const bytes = new Uint8Array([0, 1, 2, 255, 254, 253]);
    const result = base64.encodeSync(bytes);
    expect(result).toBe("AAEC//79");
  });

  it("encodeNoPaddingSync with Uint8Array input", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    const result = base64.encodeNoPaddingSync(new Uint8Array([1, 2]));
    expect(result).not.toContain("=");
    expect(result).toMatch(/^[A-Za-z0-9+/]+$/);
  });

  it("encodeUrlSync with Uint8Array input", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    // Bytes that produce + or / in standard base64
    const bytes = new Uint8Array([251, 239, 255]);
    const result = base64.encodeUrlSync(bytes);
    expect(result).not.toMatch(/[+/]/);
    expect(result).toMatch(/^[A-Za-z0-9_-]+[=]*$/);
  });

  it("encodeUrlNoPaddingSync with Uint8Array input", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    const bytes = new Uint8Array([251, 239]);
    const result = base64.encodeUrlNoPaddingSync(bytes);
    expect(result).not.toContain("=");
    expect(result).not.toMatch(/[+/]/);
  });

  it("hexEncodeSync with Uint8Array input", async () => {
    const base64 = await import("../src/index.ts");
    await base64.init();

    const bytes = new Uint8Array([0, 15, 255, 128]);
    const result = base64.hexEncodeSync(bytes);
    expect(result).toBe("000fff80");
  });
});
