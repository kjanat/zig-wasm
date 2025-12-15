/**
 * Tests for crypto module initialization and edge cases
 */
import { describe, expect, it, vi } from "vitest";

// Helper to convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

describe("@zig-wasm/crypto - NotInitializedError", () => {
  it("throws NotInitializedError when calling sync functions before init", async () => {
    // Use dynamic import to get a fresh module instance
    vi.resetModules();
    const freshCrypto = await import("../src/crypto.ts");

    // Verify module is not initialized
    expect(freshCrypto.isInitialized()).toBe(false);

    // Test that sync functions throw with correct error name
    expect(() => freshCrypto.hashSync("sha256", "test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.hashHexSync("sha256", "test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.md5Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.sha1Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.sha256Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.sha384Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.sha512Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.sha3_256Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.sha3_512Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.blake2b256Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.blake2s256Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.blake3Sync("test")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.hmacSync("sha256", "key", "data")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.hmacHexSync("sha256", "key", "data")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.hmacSha256Sync("key", "data")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.hmacSha512Sync("key", "data")).toThrowError(/not initialized/i);
    expect(() => freshCrypto.getHashDigestLengthSync("sha256")).toThrowError(/not initialized/i);
  });

  it("error message includes module name", async () => {
    vi.resetModules();
    const freshCrypto = await import("../src/crypto.ts");

    try {
      freshCrypto.sha256Sync("test");
      expect.fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).name).toBe("NotInitializedError");
      expect((e as Error).message).toContain("crypto");
    }
  });
});

describe("@zig-wasm/crypto - Init with wasmPath option", () => {
  it("initializes with custom wasmPath", async () => {
    vi.resetModules();
    const freshCrypto = await import("../src/crypto.ts");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");

    const currentDir = dirname(fileURLToPath(import.meta.url));
    const wasmPath = join(currentDir, "../wasm/crypto.wasm");

    await freshCrypto.init({ wasmPath });

    expect(freshCrypto.isInitialized()).toBe(true);
    const hash = freshCrypto.sha256Sync("test");
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });
});

describe("@zig-wasm/crypto - Init with wasmBytes option", () => {
  it("initializes with pre-loaded WASM bytes", async () => {
    vi.resetModules();
    const freshCrypto = await import("../src/crypto.ts");
    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");

    const currentDir = dirname(fileURLToPath(import.meta.url));
    const wasmPath = join(currentDir, "../wasm/crypto.wasm");
    const wasmBytes = await readFile(wasmPath);

    await freshCrypto.init({ wasmBytes });

    expect(freshCrypto.isInitialized()).toBe(true);
    const hash = freshCrypto.sha256Sync("hello");
    expect(bytesToHex(hash)).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});

describe("@zig-wasm/crypto - Init with wasmUrl option", () => {
  it("initializes with wasmUrl and custom fetchFn", async () => {
    vi.resetModules();
    const freshCrypto = await import("../src/crypto.ts");
    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath, pathToFileURL } = await import("node:url");
    const { dirname, join } = await import("node:path");

    const currentDir = dirname(fileURLToPath(import.meta.url));
    const wasmPath = join(currentDir, "../wasm/crypto.wasm");
    const wasmUrl = pathToFileURL(wasmPath).href;

    await freshCrypto.init({
      wasmUrl,
      fetchFn: async (url) => {
        const filePath = fileURLToPath(url);
        const buffer = await readFile(filePath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      },
    });

    expect(freshCrypto.isInitialized()).toBe(true);
    const hash = freshCrypto.sha256Sync("test");
    expect(hash).toBeInstanceOf(Uint8Array);
    expect(hash.length).toBe(32);
  });
});

describe("@zig-wasm/crypto - HMAC-SHA512 Sync", () => {
  it("computes HMAC-SHA512 synchronously", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const result = crypto.hmacSha512Sync("key", "data");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(64);
  });

  it("matches async HMAC-SHA512 result", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const syncResult = crypto.hmacSha512Sync("secret", "message");
    const asyncResult = await crypto.hmacSha512("secret", "message");
    expect(bytesToHex(syncResult)).toBe(bytesToHex(asyncResult));
  });

  it("handles RFC 4231 Test Case 1 synchronously", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const key = hexToBytes("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b");
    const data = hexToBytes("4869205468657265"); // "Hi There"
    const result = crypto.hmacSha512Sync(key, data);
    expect(bytesToHex(result)).toBe(
      "87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854",
    );
  });

  it("handles empty key synchronously", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const result = crypto.hmacSha512Sync("", "data");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(64);
  });

  it("handles empty data synchronously", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const result = crypto.hmacSha512Sync("key", "");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(64);
  });

  it("handles long key (> block size) synchronously", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    // Key longer than SHA-512 block size (128 bytes)
    const longKey = "k".repeat(200);
    const result = crypto.hmacSha512Sync(longKey, "data");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(64);
  });

  it("handles Uint8Array inputs synchronously", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const key = new TextEncoder().encode("secret");
    const data = new TextEncoder().encode("message");
    const result = crypto.hmacSha512Sync(key, data);
    const stringResult = crypto.hmacSha512Sync("secret", "message");
    expect(bytesToHex(result)).toBe(bytesToHex(stringResult));
  });
});

describe("@zig-wasm/crypto - Additional HMAC edge cases", () => {
  it("handles HMAC-SHA512 with very long data", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const longData = "a".repeat(10000);
    const result = crypto.hmacSha512Sync("key", longData);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(64);
  });

  it("handles HMAC with Unicode key and data", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const result = crypto.hmacSha256Sync("secret", "Hello");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);

    const result512 = crypto.hmacSha512Sync("secret", "Hello");
    expect(result512).toBeInstanceOf(Uint8Array);
    expect(result512.length).toBe(64);
  });
});

describe("@zig-wasm/crypto - Generic hmacSync with sha512", () => {
  it("computes HMAC via hmacSync with sha512 algorithm", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const result = crypto.hmacSync("sha512", "key", "data");
    const direct = crypto.hmacSha512Sync("key", "data");
    expect(bytesToHex(result)).toBe(bytesToHex(direct));
  });

  it("computes hmacHexSync with sha512 algorithm", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const result = crypto.hmacHexSync("sha512", "key", "data");
    const bytes = crypto.hmacSha512Sync("key", "data");
    expect(result).toBe(bytesToHex(bytes));
  });
});

describe("@zig-wasm/crypto - Init idempotency", () => {
  it("calling init multiple times is safe", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");

    await crypto.init();
    expect(crypto.isInitialized()).toBe(true);

    // Second call should be a no-op
    await crypto.init();
    expect(crypto.isInitialized()).toBe(true);

    // Should still work
    const hash = crypto.sha256Sync("test");
    expect(hash.length).toBe(32);
  });

  it("handles concurrent init calls", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");

    const results = await Promise.all([
      crypto.init(),
      crypto.init(),
      crypto.init(),
      crypto.init(),
    ]);

    expect(crypto.isInitialized()).toBe(true);
    // All should resolve without error
    expect(results).toHaveLength(4);
  });
});

describe("@zig-wasm/crypto - All hash algorithms with all input types", () => {
  const testData = "test data for hashing";
  const testDataBytes = new TextEncoder().encode(testData);

  it("all algorithms work with string input", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const algorithms = [
      "md5",
      "sha1",
      "sha256",
      "sha384",
      "sha512",
      "sha3-256",
      "sha3-512",
      "blake2b256",
      "blake2s256",
      "blake3",
    ] as const;

    for (const algo of algorithms) {
      const result = crypto.hashSync(algo, testData);
      expect(result).toBeInstanceOf(Uint8Array);
    }
  });

  it("all algorithms work with Uint8Array input", async () => {
    vi.resetModules();
    const crypto = await import("../src/crypto.ts");
    await crypto.init();

    const algorithms = [
      "md5",
      "sha1",
      "sha256",
      "sha384",
      "sha512",
      "sha3-256",
      "sha3-512",
      "blake2b256",
      "blake2s256",
      "blake3",
    ] as const;

    for (const algo of algorithms) {
      const stringResult = crypto.hashSync(algo, testData);
      const bytesResult = crypto.hashSync(algo, testDataBytes);
      expect(bytesToHex(stringResult)).toBe(bytesToHex(bytesResult));
    }
  });
});
