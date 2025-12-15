/**
 * Tests for crypto sync variant functions.
 * Uses deterministic test vectors generated from Zig's std.crypto.
 */

import * as crypto from "@zig-wasm/crypto";
import { beforeAll, describe, expect, it } from "vitest";
import testVectors from "./fixtures/test-vectors.json";

// Looser types to avoid strict key checking on dynamic JSON
type HashVectors = Record<string, string>;
type HmacVectors = Record<string, HashVectors>;

// Helper to convert Uint8Array to hex string for comparison
function toHex(data: Uint8Array): string {
  return Array.from(data)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Test inputs matching those in the Zig generator
const TEST_INPUTS: Record<string, string | Uint8Array> = {
  empty: "",
  test: "test",
  hello: "hello",
  "123456789": "123456789",
  single_a: "a",
  single_null: new Uint8Array([0x00]),
  single_ff: new Uint8Array([0xff]),
  hello_world: "Hello, World!",
  quick_brown_fox: "The quick brown fox jumps over the lazy dog",
  unicode_emoji: "\u{1F600}",
  unicode_chinese: "\u4E2D\u6587",
  all_zeros_8: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]),
  len_1: "x",
  len_32: "12345678901234567890123456789012",
  len_64: "1234567890123456789012345678901234567890123456789012345678901234",
  spaces: "   ",
  json_like: "{\"key\": \"value\", \"num\": 123}",
};

// HMAC keys matching those in the Zig generator
const HMAC_KEYS: Record<string, string> = {
  empty: "",
  short: "key",
  secret: "secret",
  long_key: "this_is_a_much_longer_key_for_hmac_testing_purposes_1234567890",
};

describe("@zig-wasm/crypto - Deterministic Test Vectors", () => {
  beforeAll(async () => {
    await crypto.init();
  });

  describe("md5Sync", () => {
    const vectors = testVectors.md5 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("md5(%s) matches expected", (name, input) => {
      const result = crypto.md5Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (16 bytes)", () => {
      expect(crypto.md5Sync("test").length).toBe(16);
    });
  });

  describe("sha1Sync", () => {
    const vectors = testVectors.sha1 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("sha1(%s) matches expected", (name, input) => {
      const result = crypto.sha1Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (20 bytes)", () => {
      expect(crypto.sha1Sync("test").length).toBe(20);
    });
  });

  describe("sha256Sync", () => {
    const vectors = testVectors.sha256 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("sha256(%s) matches expected", (name, input) => {
      const result = crypto.sha256Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (32 bytes)", () => {
      expect(crypto.sha256Sync("test").length).toBe(32);
    });
  });

  describe("sha384Sync", () => {
    const vectors = testVectors.sha384 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("sha384(%s) matches expected", (name, input) => {
      const result = crypto.sha384Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (48 bytes)", () => {
      expect(crypto.sha384Sync("test").length).toBe(48);
    });
  });

  describe("sha512Sync", () => {
    const vectors = testVectors.sha512 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("sha512(%s) matches expected", (name, input) => {
      const result = crypto.sha512Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (64 bytes)", () => {
      expect(crypto.sha512Sync("test").length).toBe(64);
    });
  });

  describe("sha3_256Sync", () => {
    const vectors = testVectors.sha3_256 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("sha3_256(%s) matches expected", (name, input) => {
      const result = crypto.sha3_256Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (32 bytes)", () => {
      expect(crypto.sha3_256Sync("test").length).toBe(32);
    });
  });

  describe("sha3_512Sync", () => {
    const vectors = testVectors.sha3_512 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("sha3_512(%s) matches expected", (name, input) => {
      const result = crypto.sha3_512Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (64 bytes)", () => {
      expect(crypto.sha3_512Sync("test").length).toBe(64);
    });
  });

  describe("blake2b256Sync", () => {
    const vectors = testVectors.blake2b256 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("blake2b256(%s) matches expected", (name, input) => {
      const result = crypto.blake2b256Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (32 bytes)", () => {
      expect(crypto.blake2b256Sync("test").length).toBe(32);
    });
  });

  describe("blake2s256Sync", () => {
    const vectors = testVectors.blake2s256 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("blake2s256(%s) matches expected", (name, input) => {
      const result = crypto.blake2s256Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (32 bytes)", () => {
      expect(crypto.blake2s256Sync("test").length).toBe(32);
    });
  });

  describe("blake3Sync", () => {
    const vectors = testVectors.blake3 as HashVectors;

    it.each(Object.entries(TEST_INPUTS))("blake3(%s) matches expected", (name, input) => {
      const result = crypto.blake3Sync(input);
      expect(toHex(result)).toBe(vectors[name as keyof typeof vectors]);
    });

    it("returns correct length (32 bytes)", () => {
      expect(crypto.blake3Sync("test").length).toBe(32);
    });
  });
});

describe("@zig-wasm/crypto - HMAC Test Vectors", () => {
  beforeAll(async () => {
    await crypto.init();
  });

  describe("hmacSha256Sync", () => {
    const vectors = testVectors.hmac_sha256 as HmacVectors;

    it.each(Object.entries(HMAC_KEYS))("hmacSha256 with key=%s matches expected", (keyName, key) => {
      const keyVectors = vectors[keyName as keyof typeof vectors] as HashVectors;
      for (const [inputName, input] of Object.entries(TEST_INPUTS)) {
        const result = crypto.hmacSha256Sync(key, input);
        expect(toHex(result)).toBe(keyVectors[inputName as keyof typeof keyVectors]);
      }
    });

    it("returns correct length (32 bytes)", () => {
      expect(crypto.hmacSha256Sync("key", "data").length).toBe(32);
    });
  });

  describe("hmacSha512Sync", () => {
    const vectors = testVectors.hmac_sha512 as HmacVectors;

    it.each(Object.entries(HMAC_KEYS))("hmacSha512 with key=%s matches expected", (keyName, key) => {
      const keyVectors = vectors[keyName as keyof typeof vectors] as HashVectors;
      for (const [inputName, input] of Object.entries(TEST_INPUTS)) {
        const result = crypto.hmacSha512Sync(key, input);
        expect(toHex(result)).toBe(keyVectors[inputName as keyof typeof keyVectors]);
      }
    });

    it("returns correct length (64 bytes)", () => {
      expect(crypto.hmacSha512Sync("key", "data").length).toBe(64);
    });
  });
});

describe("@zig-wasm/crypto - Generic hashSync and hashHexSync", () => {
  beforeAll(async () => {
    await crypto.init();
  });

  describe("hashHexSync with deterministic vectors", () => {
    it("hashHexSync(md5, test) matches expected", () => {
      expect(crypto.hashHexSync("md5", "test")).toBe(testVectors.md5.test);
    });

    it("hashHexSync(sha1, test) matches expected", () => {
      expect(crypto.hashHexSync("sha1", "test")).toBe(testVectors.sha1.test);
    });

    it("hashHexSync(sha256, test) matches expected", () => {
      expect(crypto.hashHexSync("sha256", "test")).toBe(testVectors.sha256.test);
    });

    it("hashHexSync(sha384, test) matches expected", () => {
      expect(crypto.hashHexSync("sha384", "test")).toBe(testVectors.sha384.test);
    });

    it("hashHexSync(sha512, test) matches expected", () => {
      expect(crypto.hashHexSync("sha512", "test")).toBe(testVectors.sha512.test);
    });

    it("hashHexSync(sha3-256, test) matches expected", () => {
      expect(crypto.hashHexSync("sha3-256", "test")).toBe(testVectors.sha3_256.test);
    });

    it("hashHexSync(sha3-512, test) matches expected", () => {
      expect(crypto.hashHexSync("sha3-512", "test")).toBe(testVectors.sha3_512.test);
    });

    it("hashHexSync(blake2b256, test) matches expected", () => {
      expect(crypto.hashHexSync("blake2b256", "test")).toBe(testVectors.blake2b256.test);
    });

    it("hashHexSync(blake2s256, test) matches expected", () => {
      expect(crypto.hashHexSync("blake2s256", "test")).toBe(testVectors.blake2s256.test);
    });

    it("hashHexSync(blake3, test) matches expected", () => {
      expect(crypto.hashHexSync("blake3", "test")).toBe(testVectors.blake3.test);
    });
  });

  describe("hmacHexSync with deterministic vectors", () => {
    const hmac256Vectors = testVectors.hmac_sha256 as HmacVectors;
    const hmac512Vectors = testVectors.hmac_sha512 as HmacVectors;

    it("hmacHexSync(sha256, key, test) matches expected", () => {
      const keyVectors = hmac256Vectors.short as HashVectors;
      expect(crypto.hmacHexSync("sha256", "key", "test")).toBe(keyVectors.test);
    });

    it("hmacHexSync(sha512, key, test) matches expected", () => {
      const keyVectors = hmac512Vectors.short as HashVectors;
      expect(crypto.hmacHexSync("sha512", "key", "test")).toBe(keyVectors.test);
    });
  });
});

describe("@zig-wasm/crypto - Edge Cases", () => {
  beforeAll(async () => {
    await crypto.init();
  });

  it("handles binary data with null bytes", () => {
    const withNull = new Uint8Array([0x00, 0x01, 0x02]);
    const result = crypto.sha256Sync(withNull);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("handles unicode strings correctly", () => {
    expect(toHex(crypto.sha256Sync("\u{1F600}"))).toBe(testVectors.sha256.unicode_emoji);
  });

  it("handles empty input", () => {
    expect(toHex(crypto.sha256Sync(""))).toBe(testVectors.sha256.empty);
    expect(toHex(crypto.blake3Sync(""))).toBe(testVectors.blake3.empty);
  });

  it("is deterministic across multiple calls", () => {
    const input = "determinism test";
    const results = Array.from({ length: 10 }, () => toHex(crypto.sha256Sync(input)));
    expect(new Set(results).size).toBe(1);
  });

  it("HMAC with empty key works correctly", () => {
    const keyVectors = (testVectors.hmac_sha256 as HmacVectors).empty as HashVectors;
    expect(toHex(crypto.hmacSha256Sync("", "test"))).toBe(keyVectors.test);
  });
});

describe("@zig-wasm/crypto - Concurrent Initialization", () => {
  it("handles concurrent init calls safely", async () => {
    const cryptoModule = await import("@zig-wasm/crypto");

    const promises = [
      cryptoModule.init(),
      cryptoModule.init(),
      cryptoModule.init(),
    ];

    await Promise.all(promises);

    expect(cryptoModule.isInitialized()).toBe(true);
    expect(toHex(cryptoModule.sha256Sync("test"))).toBe(testVectors.sha256.test);
  });
});
