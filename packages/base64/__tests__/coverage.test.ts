/**
 * Additional tests for coverage gaps and edge cases
 * Covers: decodeNoPadding, decodeUrl, decodeUrlNoPadding async functions
 * and various edge cases
 */
import * as base64 from "@zig-wasm/base64";
import { beforeAll, describe, expect, it } from "vitest";

describe("@zig-wasm/base64 - Init options (coverage)", () => {
  it("init with wasmPath option", async () => {
    // This tests the wasmPath branch - we use the actual path
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const wasmPath = join(currentDir, "../wasm/base64.wasm");

    // Import fresh module to test init path
    const { init, encodeSync } = await import("@zig-wasm/base64");
    await init({ wasmPath });

    const result = encodeSync("test");
    expect(result).toBe("dGVzdA==");
  });
});

describe("@zig-wasm/base64 - Async decode variants (coverage)", () => {
  beforeAll(async () => {
    await base64.init();
  });

  describe("decodeNoPadding (async)", () => {
    it("decodes base64 without padding - simple", async () => {
      // "Hello" encoded without padding
      const result = await base64.decodeNoPadding("SGVsbG8");
      expect(new TextDecoder().decode(result)).toBe("Hello");
    });

    it("decodes base64 without padding - single char", async () => {
      const result = await base64.decodeNoPadding("YQ");
      expect(new TextDecoder().decode(result)).toBe("a");
    });

    it("decodes base64 without padding - two chars", async () => {
      const result = await base64.decodeNoPadding("YWI");
      expect(new TextDecoder().decode(result)).toBe("ab");
    });

    it("decodes base64 without padding - three chars", async () => {
      const result = await base64.decodeNoPadding("YWJj");
      expect(new TextDecoder().decode(result)).toBe("abc");
    });

    it("roundtrips correctly", async () => {
      const original = "Test data for roundtrip";
      const encoded = await base64.encodeNoPadding(original);
      const decoded = await base64.decodeNoPadding(encoded);
      expect(new TextDecoder().decode(decoded)).toBe(original);
    });

    it("handles binary data", async () => {
      const original = new Uint8Array([0, 128, 255, 1, 127]);
      const encoded = await base64.encodeNoPadding(original);
      const decoded = await base64.decodeNoPadding(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe("decodeUrl (async)", () => {
    it("decodes URL-safe base64 - simple", async () => {
      // "test" in URL-safe base64 with padding
      const result = await base64.decodeUrl("dGVzdA==");
      expect(new TextDecoder().decode(result)).toBe("test");
    });

    it("decodes URL-safe base64 - with special chars", async () => {
      // Bytes that would produce + and / in standard base64
      const bytes = new Uint8Array([251, 239, 255]);
      const encoded = await base64.encodeUrl(bytes);
      const decoded = await base64.decodeUrl(encoded);
      expect(decoded).toEqual(bytes);
    });

    it("roundtrips URL-safe encoding", async () => {
      const original = "URL safe test: param=value&key=123";
      const encoded = await base64.encodeUrl(original);
      const decoded = await base64.decodeUrl(encoded);
      expect(new TextDecoder().decode(decoded)).toBe(original);
    });

    it("handles binary data with URL-safe", async () => {
      const original = new Uint8Array([255, 254, 253, 252, 251]);
      const encoded = await base64.encodeUrl(original);
      const decoded = await base64.decodeUrl(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe("decodeUrlNoPadding (async)", () => {
    it("decodes URL-safe base64 without padding - simple", async () => {
      const result = await base64.decodeUrlNoPadding("dGVzdA");
      expect(new TextDecoder().decode(result)).toBe("test");
    });

    it("decodes JWT-like payloads", async () => {
      // A typical JWT payload structure
      const payload = { sub: "123", name: "Test" };
      const encoded = await base64.encodeUrlNoPadding(JSON.stringify(payload));
      const decoded = await base64.decodeUrlNoPadding(encoded);
      const parsed = JSON.parse(new TextDecoder().decode(decoded));
      expect(parsed).toEqual(payload);
    });

    it("roundtrips correctly", async () => {
      const original = "URL no padding roundtrip";
      const encoded = await base64.encodeUrlNoPadding(original);
      const decoded = await base64.decodeUrlNoPadding(encoded);
      expect(new TextDecoder().decode(decoded)).toBe(original);
    });

    it("handles binary data", async () => {
      const original = new Uint8Array([0, 127, 128, 255]);
      const encoded = await base64.encodeUrlNoPadding(original);
      const decoded = await base64.decodeUrlNoPadding(encoded);
      expect(decoded).toEqual(original);
    });

    it("handles single byte", async () => {
      const result = await base64.decodeUrlNoPadding("YQ");
      expect(new TextDecoder().decode(result)).toBe("a");
    });
  });
});

describe("@zig-wasm/base64 - Empty input handling", () => {
  beforeAll(async () => {
    await base64.init();
  });

  describe("async API", () => {
    it("encode handles empty string", async () => {
      const result = await base64.encode("");
      expect(result).toBe("");
    });

    it("encode handles empty Uint8Array", async () => {
      const result = await base64.encode(new Uint8Array(0));
      expect(result).toBe("");
    });

    it("decode handles empty string", async () => {
      const result = await base64.decode("");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("encodeNoPadding handles empty string", async () => {
      const result = await base64.encodeNoPadding("");
      expect(result).toBe("");
    });

    it("decodeNoPadding handles empty string", async () => {
      const result = await base64.decodeNoPadding("");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("encodeUrl handles empty string", async () => {
      const result = await base64.encodeUrl("");
      expect(result).toBe("");
    });

    it("decodeUrl handles empty string", async () => {
      const result = await base64.decodeUrl("");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("encodeUrlNoPadding handles empty string", async () => {
      const result = await base64.encodeUrlNoPadding("");
      expect(result).toBe("");
    });

    it("decodeUrlNoPadding handles empty string", async () => {
      const result = await base64.decodeUrlNoPadding("");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("hexEncode handles empty string", async () => {
      const result = await base64.hexEncode("");
      expect(result).toBe("");
    });

    it("hexDecode handles empty string", async () => {
      const result = await base64.hexDecode("");
      expect(result).toEqual(new Uint8Array(0));
    });
  });

  describe("sync API", () => {
    it("encodeSync handles empty string", () => {
      const result = base64.encodeSync("");
      expect(result).toBe("");
    });

    it("decodeSync handles empty string", () => {
      const result = base64.decodeSync("");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("encodeNoPaddingSync handles empty input", () => {
      const result = base64.encodeNoPaddingSync("");
      expect(result).toBe("");
    });

    it("decodeNoPaddingSync handles empty input", () => {
      const result = base64.decodeNoPaddingSync("");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("encodeUrlSync handles empty input", () => {
      const result = base64.encodeUrlSync("");
      expect(result).toBe("");
    });

    it("decodeUrlSync handles empty input", () => {
      const result = base64.decodeUrlSync("");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("encodeUrlNoPaddingSync handles empty input", () => {
      const result = base64.encodeUrlNoPaddingSync("");
      expect(result).toBe("");
    });

    it("decodeUrlNoPaddingSync handles empty input", () => {
      const result = base64.decodeUrlNoPaddingSync("");
      expect(result).toEqual(new Uint8Array(0));
    });

    it("hexEncodeSync handles empty input", () => {
      const result = base64.hexEncodeSync("");
      expect(result).toBe("");
    });

    it("hexDecodeSync handles empty input", () => {
      const result = base64.hexDecodeSync("");
      expect(result).toEqual(new Uint8Array(0));
    });
  });
});

describe("@zig-wasm/base64 - Cross-variant compatibility", () => {
  beforeAll(async () => {
    await base64.init();
  });

  it("sync and async encode produce same results", async () => {
    const input = "test data 123";

    expect(base64.encodeSync(input)).toBe(await base64.encode(input));
    expect(base64.encodeNoPaddingSync(input)).toBe(await base64.encodeNoPadding(input));
    expect(base64.encodeUrlSync(input)).toBe(await base64.encodeUrl(input));
    expect(base64.encodeUrlNoPaddingSync(input)).toBe(await base64.encodeUrlNoPadding(input));
    expect(base64.hexEncodeSync(input)).toBe(await base64.hexEncode(input));
  });

  it("sync and async decode produce same results", async () => {
    const encoded = "dGVzdCBkYXRhIDEyMw==";
    const encodedNoPad = "dGVzdCBkYXRhIDEyMw";
    const hex = "74657374206461746120313233";

    expect(base64.decodeSync(encoded)).toEqual(await base64.decode(encoded));
    expect(base64.decodeNoPaddingSync(encodedNoPad)).toEqual(await base64.decodeNoPadding(encodedNoPad));
    expect(base64.decodeUrlSync(encoded)).toEqual(await base64.decodeUrl(encoded));
    expect(base64.decodeUrlNoPaddingSync(encodedNoPad)).toEqual(await base64.decodeUrlNoPadding(encodedNoPad));
    expect(base64.hexDecodeSync(hex)).toEqual(await base64.hexDecode(hex));
  });
});

describe("@zig-wasm/base64 - Uint8Array input variants", () => {
  beforeAll(async () => {
    await base64.init();
  });

  const binaryData = new Uint8Array([0, 1, 2, 127, 128, 254, 255]);

  describe("async API with Uint8Array", () => {
    it("encode accepts Uint8Array", async () => {
      const result = await base64.encode(binaryData);
      expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it("encodeNoPadding accepts Uint8Array", async () => {
      const result = await base64.encodeNoPadding(binaryData);
      expect(result).not.toContain("=");
    });

    it("encodeUrl accepts Uint8Array", async () => {
      const result = await base64.encodeUrl(binaryData);
      expect(result).not.toMatch(/[+/]/);
    });

    it("encodeUrlNoPadding accepts Uint8Array", async () => {
      const result = await base64.encodeUrlNoPadding(binaryData);
      expect(result).not.toContain("=");
      expect(result).not.toMatch(/[+/]/);
    });

    it("hexEncode accepts Uint8Array", async () => {
      const result = await base64.hexEncode(binaryData);
      expect(result).toMatch(/^[0-9a-f]+$/);
      expect(result.length).toBe(binaryData.length * 2);
    });
  });
});

describe("@zig-wasm/base64 - Whitespace and special character inputs", () => {
  beforeAll(async () => {
    await base64.init();
  });

  it("encodes whitespace-only strings", async () => {
    const result = await base64.encode("   ");
    expect(result).toBe("ICAg");
  });

  it("encodes newlines", async () => {
    const result = await base64.encode("\n\r\n");
    expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("encodes tabs", async () => {
    const result = await base64.encode("\t\t");
    expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it("encodes mixed whitespace", async () => {
    const input = " \t\n\r ";
    const encoded = await base64.encode(input);
    const decoded = await base64.decode(encoded);
    expect(new TextDecoder().decode(decoded)).toBe(input);
  });

  it("encodes null characters in string context", async () => {
    // Using Uint8Array with null bytes
    const withNulls = new Uint8Array([0, 65, 0, 66, 0]);
    const encoded = await base64.encode(withNulls);
    const decoded = await base64.decode(encoded);
    expect(decoded).toEqual(withNulls);
  });
});

describe("@zig-wasm/base64 - Standard decode roundtrips", () => {
  beforeAll(async () => {
    await base64.init();
  });

  it("roundtrips ASCII text", async () => {
    const input = "Hello, World! 12345";
    const encoded = await base64.encode(input);
    const decoded = await base64.decode(encoded);
    expect(new TextDecoder().decode(decoded)).toBe(input);
  });

  it("roundtrips Unicode", async () => {
    const input = "Hello 世界 مرحبا 🌍";
    const encoded = await base64.encode(input);
    const decoded = await base64.decode(encoded);
    expect(new TextDecoder().decode(decoded)).toBe(input);
  });

  it("roundtrips binary data through all variants", async () => {
    const original = new Uint8Array([0, 63, 64, 127, 128, 191, 192, 255]);

    // Standard
    const enc1 = await base64.encode(original);
    const dec1 = await base64.decode(enc1);
    expect(dec1).toEqual(original);

    // No padding
    const enc2 = await base64.encodeNoPadding(original);
    const dec2 = await base64.decodeNoPadding(enc2);
    expect(dec2).toEqual(original);

    // URL safe
    const enc3 = await base64.encodeUrl(original);
    const dec3 = await base64.decodeUrl(enc3);
    expect(dec3).toEqual(original);

    // URL safe no padding
    const enc4 = await base64.encodeUrlNoPadding(original);
    const dec4 = await base64.decodeUrlNoPadding(enc4);
    expect(dec4).toEqual(original);

    // Hex
    const enc5 = await base64.hexEncode(original);
    const dec5 = await base64.hexDecode(enc5);
    expect(dec5).toEqual(original);
  });
});
