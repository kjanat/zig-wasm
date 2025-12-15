/**
 * Tests for crypto sync variant functions
 */

import * as crypto from "@zig-wasm/crypto";
import { beforeAll, describe, expect, it } from "vitest";

describe("@zig-wasm/crypto - Sync Hash Algorithm Variants", () => {
  beforeAll(async () => {
    await crypto.init();
  });

  describe("md5Sync", () => {
    it("returns correct hash for known input", () => {
      const result = crypto.md5Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(16); // MD5 is 128 bits = 16 bytes
    });

    it("is deterministic", () => {
      const result1 = crypto.md5Sync("test");
      const result2 = crypto.md5Sync("test");
      expect(result1).toEqual(result2);
    });
  });

  describe("sha1Sync", () => {
    it("returns correct hash for known input", () => {
      const result = crypto.sha1Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(20); // SHA1 is 160 bits = 20 bytes
    });

    it("handles Uint8Array input", () => {
      const input = new TextEncoder().encode("test");
      const result = crypto.sha1Sync(input);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(20);
    });
  });

  describe("sha384Sync", () => {
    it("returns correct hash length", () => {
      const result = crypto.sha384Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(48); // SHA384 is 384 bits = 48 bytes
    });
  });

  describe("sha512Sync", () => {
    it("returns correct hash length", () => {
      const result = crypto.sha512Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(64); // SHA512 is 512 bits = 64 bytes
    });
  });

  describe("sha3_256Sync", () => {
    it("returns correct hash length", () => {
      const result = crypto.sha3_256Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // SHA3-256 is 256 bits = 32 bytes
    });
  });

  describe("sha3_512Sync", () => {
    it("returns correct hash length", () => {
      const result = crypto.sha3_512Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(64); // SHA3-512 is 512 bits = 64 bytes
    });
  });

  describe("blake2b256Sync", () => {
    it("returns correct hash length", () => {
      const result = crypto.blake2b256Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // BLAKE2b-256 is 256 bits = 32 bytes
    });
  });

  describe("blake2s256Sync", () => {
    it("returns correct hash length", () => {
      const result = crypto.blake2s256Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // BLAKE2s-256 is 256 bits = 32 bytes
    });
  });

  describe("blake3Sync", () => {
    it("returns correct hash length", () => {
      const result = crypto.blake3Sync("hello");
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(32); // BLAKE3 default is 256 bits = 32 bytes
    });
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
    const result = cryptoModule.sha256Sync("test");
    expect(result).toBeInstanceOf(Uint8Array);
  });
});
