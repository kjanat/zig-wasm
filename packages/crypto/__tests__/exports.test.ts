import * as crypto from "@zig-wasm/crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

describe("@zig-wasm/crypto exports", () => {
  it("exposes lifecycle helpers", () => {
    expect(crypto.isInitialized()).toBe(false);
    expect(crypto.init).toBeTypeOf("function");
  });

  it("exposes hash functions", () => {
    expect(crypto.sha256).toBeTypeOf("function");
    expect(crypto.blake3).toBeTypeOf("function");
    expect(crypto.hash).toBeTypeOf("function");
    expect(crypto.hashHex).toBeTypeOf("function");
  });

  it("exposes HMAC helpers", () => {
    expect(crypto.hmac).toBeTypeOf("function");
    expect(crypto.hmacSha256).toBeTypeOf("function");
    expect(crypto.hmacHex).toBeTypeOf("function");
  });

  it("exposes sync variants", () => {
    expect(crypto.sha256Sync).toBeTypeOf("function");
    expect(crypto.hashSync).toBeTypeOf("function");
    expect(crypto.hmacSync).toBeTypeOf("function");
  });
});

/**
 * Cryptographic Test Vectors
 *
 * Test vectors from official cryptographic standards:
 * - NIST FIPS publications
 * - RFC specifications
 * - Algorithm reference implementations
 */

// Helper to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Helper to convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

describe("MD5 (NIST Test Vectors)", () => {
  it("computes MD5 for empty string", async () => {
    const result = await crypto.md5("");
    expect(bytesToHex(result)).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });

  it("computes MD5 for 'a'", async () => {
    const result = await crypto.md5("a");
    expect(bytesToHex(result)).toBe("0cc175b9c0f1b6a831c399e269772661");
  });

  it("computes MD5 for 'abc'", async () => {
    const result = await crypto.md5("abc");
    expect(bytesToHex(result)).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it("computes MD5 for 'message digest'", async () => {
    const result = await crypto.md5("message digest");
    expect(bytesToHex(result)).toBe("f96b697d7cb7938d525a2f31aaf161d0");
  });

  it("computes MD5 for alphabet", async () => {
    const result = await crypto.md5("abcdefghijklmnopqrstuvwxyz");
    expect(bytesToHex(result)).toBe("c3fcd3d76192e4007dfb496cca67e13b");
  });
});

describe("SHA-1 (NIST FIPS 180-4 Test Vectors)", () => {
  it("computes SHA-1 for empty string", async () => {
    const result = await crypto.sha1("");
    expect(bytesToHex(result)).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
  });

  it("computes SHA-1 for 'abc'", async () => {
    const result = await crypto.sha1("abc");
    expect(bytesToHex(result)).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
  });

  it("computes SHA-1 for 448-bit message", async () => {
    const result = await crypto.sha1("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
    expect(bytesToHex(result)).toBe("84983e441c3bd26ebaae4aa1f95129e5e54670f1");
  });
});

describe("SHA-256 (NIST FIPS 180-4 Test Vectors)", () => {
  it("computes SHA-256 for empty string", async () => {
    const result = await crypto.sha256("");
    expect(bytesToHex(result)).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("computes SHA-256 for 'abc'", async () => {
    const result = await crypto.sha256("abc");
    expect(bytesToHex(result)).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("computes SHA-256 for 448-bit message", async () => {
    const result = await crypto.sha256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
    expect(bytesToHex(result)).toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
  });

  it("computes SHA-256 for binary data", async () => {
    const input = hexToBytes("bd");
    const result = await crypto.sha256(input);
    expect(bytesToHex(result)).toBe("68325720aabd7c82f30f554b313d0570c95accbb7dc4b5aae11204c08ffe732b");
  });

  it("computes SHA-256 for multi-byte binary data", async () => {
    const input = hexToBytes("c98c8e55");
    const result = await crypto.sha256(input);
    expect(bytesToHex(result)).toBe("7abc22c0ae5af26ce93dbb94433a0e0b2e119d014f8e7f65bd56c61ccccd9504");
  });
});

describe("SHA-384 (NIST FIPS 180-4 Test Vectors)", () => {
  it("computes SHA-384 for empty string", async () => {
    const result = await crypto.sha384("");
    expect(bytesToHex(result)).toBe(
      "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
    );
  });

  it("computes SHA-384 for 'abc'", async () => {
    const result = await crypto.sha384("abc");
    expect(bytesToHex(result)).toBe(
      "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7",
    );
  });

  it("computes SHA-384 for 896-bit message", async () => {
    const result = await crypto.sha384(
      "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
    );
    expect(bytesToHex(result)).toBe(
      "09330c33f71147e83d192fc782cd1b4753111b173b3b05d22fa08086e3b0f712fcc7c71a557e2db966c3e9fa91746039",
    );
  });
});

describe("SHA-512 (NIST FIPS 180-4 Test Vectors)", () => {
  it("computes SHA-512 for empty string", async () => {
    const result = await crypto.sha512("");
    expect(bytesToHex(result)).toBe(
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
    );
  });

  it("computes SHA-512 for 'abc'", async () => {
    const result = await crypto.sha512("abc");
    expect(bytesToHex(result)).toBe(
      "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f",
    );
  });

  it("computes SHA-512 for 896-bit message", async () => {
    const result = await crypto.sha512(
      "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
    );
    expect(bytesToHex(result)).toBe(
      "8e959b75dae313da8cf4f72814fc143f8f7779c6eb9f7fa17299aeadb6889018501d289e4900f7e4331b99dec4b5433ac7d329eeb6dd26545e96e55b874be909",
    );
  });
});

describe("SHA3-256 (NIST FIPS 202 Test Vectors)", () => {
  it("computes SHA3-256 for empty string", async () => {
    const result = await crypto.sha3_256("");
    expect(bytesToHex(result)).toBe("a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a");
  });

  it("computes SHA3-256 for 'abc'", async () => {
    const result = await crypto.sha3_256("abc");
    expect(bytesToHex(result)).toBe("3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532");
  });

  it("computes SHA3-256 for longer message", async () => {
    const result = await crypto.sha3_256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq");
    expect(bytesToHex(result)).toBe("41c0dba2a9d6240849100376a8235e2c82e1b9998a999e21db32dd97496d3376");
  });
});

describe("SHA3-512 (NIST FIPS 202 Test Vectors)", () => {
  it("computes SHA3-512 for empty string", async () => {
    const result = await crypto.sha3_512("");
    expect(bytesToHex(result)).toBe(
      "a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a615b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26",
    );
  });

  it("computes SHA3-512 for 'abc'", async () => {
    const result = await crypto.sha3_512("abc");
    expect(bytesToHex(result)).toBe(
      "b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0",
    );
  });
});

describe("BLAKE2b-256 Test Vectors", () => {
  it("computes BLAKE2b-256 for empty string", async () => {
    const result = await crypto.blake2b256("");
    expect(bytesToHex(result)).toBe("0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8");
  });

  it("computes BLAKE2b-256 for 'abc'", async () => {
    const result = await crypto.blake2b256("abc");
    expect(bytesToHex(result)).toBe("bddd813c634239723171ef3fee98579b94964e3bb1cb3e427262c8c068d52319");
  });
});

describe("BLAKE2s-256 Test Vectors", () => {
  it("computes BLAKE2s-256 for empty string", async () => {
    const result = await crypto.blake2s256("");
    expect(bytesToHex(result)).toBe("69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9");
  });

  it("computes BLAKE2s-256 for 'abc'", async () => {
    const result = await crypto.blake2s256("abc");
    expect(bytesToHex(result)).toBe("508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982");
  });
});

describe("BLAKE3 Test Vectors", () => {
  it("computes BLAKE3 for empty string", async () => {
    const result = await crypto.blake3("");
    expect(bytesToHex(result)).toBe("af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262");
  });

  it("computes BLAKE3 for 'abc'", async () => {
    const result = await crypto.blake3("abc");
    expect(bytesToHex(result)).toBe("6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85");
  });
});

describe("HMAC-SHA256 (RFC 4231 Test Vectors)", () => {
  it("computes HMAC-SHA256 Test Case 1", async () => {
    const key = hexToBytes("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b");
    const data = hexToBytes("4869205468657265"); // "Hi There"
    const result = await crypto.hmacSha256(key, data);
    expect(bytesToHex(result)).toBe("b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7");
  });

  it("computes HMAC-SHA256 Test Case 2", async () => {
    const key = "Jefe";
    const data = "what do ya want for nothing?";
    const result = await crypto.hmacSha256(key, data);
    expect(bytesToHex(result)).toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
  });

  it("computes HMAC-SHA256 Test Case 3", async () => {
    const key = hexToBytes("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const data = hexToBytes(
      "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    );
    const result = await crypto.hmacSha256(key, data);
    expect(bytesToHex(result)).toBe("773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe");
  });

  it("computes HMAC-SHA256 Test Case 4", async () => {
    const key = hexToBytes("0102030405060708090a0b0c0d0e0f10111213141516171819");
    const data = hexToBytes(
      "cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd",
    );
    const result = await crypto.hmacSha256(key, data);
    expect(bytesToHex(result)).toBe("82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b");
  });

  it("computes HMAC-SHA256 with longer key (Test Case 6)", async () => {
    const key = hexToBytes(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    const data = "Test Using Larger Than Block-Size Key - Hash Key First";
    const result = await crypto.hmacSha256(key, data);
    expect(bytesToHex(result)).toBe("60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54");
  });
});

describe("HMAC-SHA512 (RFC 4231 Test Vectors)", () => {
  it("computes HMAC-SHA512 Test Case 1", async () => {
    const key = hexToBytes("0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b");
    const data = hexToBytes("4869205468657265"); // "Hi There"
    const result = await crypto.hmacSha512(key, data);
    expect(bytesToHex(result)).toBe(
      "87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854",
    );
  });

  it("computes HMAC-SHA512 Test Case 2", async () => {
    const key = "Jefe";
    const data = "what do ya want for nothing?";
    const result = await crypto.hmacSha512(key, data);
    expect(bytesToHex(result)).toBe(
      "164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea2505549758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737",
    );
  });

  it("computes HMAC-SHA512 Test Case 3", async () => {
    const key = hexToBytes("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const data = hexToBytes(
      "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    );
    const result = await crypto.hmacSha512(key, data);
    expect(bytesToHex(result)).toBe(
      "fa73b0089d56a284efb0f0756c890be9b1b5dbdd8ee81a3655f83e33b2279d39bf3e848279a722c806b485a47e67c807b946a337bee8942674278859e13292fb",
    );
  });
});

describe("Generic Hash API", () => {
  it("supports generic hash with algorithm parameter", async () => {
    const result = await crypto.hash("sha256", "test");
    const direct = await crypto.sha256("test");
    expect(bytesToHex(result)).toBe(bytesToHex(direct));
  });

  it("supports hashHex for direct hex output", async () => {
    const result = await crypto.hashHex("sha256", "test");
    const bytes = await crypto.sha256("test");
    expect(result).toBe(bytesToHex(bytes));
  });

  it("supports generic HMAC with algorithm parameter", async () => {
    const result = await crypto.hmac("sha256", "key", "data");
    const direct = await crypto.hmacSha256("key", "data");
    expect(bytesToHex(result)).toBe(bytesToHex(direct));
  });

  it("supports hmacHex for direct hex output", async () => {
    const result = await crypto.hmacHex("sha256", "key", "data");
    const bytes = await crypto.hmacSha256("key", "data");
    expect(result).toBe(bytesToHex(bytes));
  });
});

describe("Digest Lengths", () => {
  it("returns correct digest length for MD5 (16 bytes)", async () => {
    expect(await crypto.getHashDigestLength("md5")).toBe(16);
  });

  it("returns correct digest length for SHA-1 (20 bytes)", async () => {
    expect(await crypto.getHashDigestLength("sha1")).toBe(20);
  });

  it("returns correct digest length for SHA-256 (32 bytes)", async () => {
    expect(await crypto.getHashDigestLength("sha256")).toBe(32);
  });

  it("returns correct digest length for SHA-384 (48 bytes)", async () => {
    expect(await crypto.getHashDigestLength("sha384")).toBe(48);
  });

  it("returns correct digest length for SHA-512 (64 bytes)", async () => {
    expect(await crypto.getHashDigestLength("sha512")).toBe(64);
  });

  it("returns correct digest length for SHA3-256 (32 bytes)", async () => {
    expect(await crypto.getHashDigestLength("sha3-256")).toBe(32);
  });

  it("returns correct digest length for SHA3-512 (64 bytes)", async () => {
    expect(await crypto.getHashDigestLength("sha3-512")).toBe(64);
  });

  it("returns correct digest length for BLAKE2b-256 (32 bytes)", async () => {
    expect(await crypto.getHashDigestLength("blake2b256")).toBe(32);
  });

  it("returns correct digest length for BLAKE2s-256 (32 bytes)", async () => {
    expect(await crypto.getHashDigestLength("blake2s256")).toBe(32);
  });

  it("returns correct digest length for BLAKE3 (32 bytes)", async () => {
    expect(await crypto.getHashDigestLength("blake3")).toBe(32);
  });
});

describe("Sync API", () => {
  beforeAll(async () => {
    await crypto.init();
  });

  it("computes SHA-256 synchronously", () => {
    const result = crypto.sha256Sync("abc");
    expect(bytesToHex(result)).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("computes HMAC-SHA256 synchronously", () => {
    const result = crypto.hmacSha256Sync("Jefe", "what do ya want for nothing?");
    expect(bytesToHex(result)).toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
  });

  it("supports generic hashSync", () => {
    const result = crypto.hashSync("sha256", "test");
    const direct = crypto.sha256Sync("test");
    expect(bytesToHex(result)).toBe(bytesToHex(direct));
  });

  it("supports hashHexSync", () => {
    const result = crypto.hashHexSync("sha256", "test");
    const bytes = crypto.sha256Sync("test");
    expect(result).toBe(bytesToHex(bytes));
  });

  it("supports hmacSync", () => {
    const result = crypto.hmacSync("sha256", "key", "data");
    const direct = crypto.hmacSha256Sync("key", "data");
    expect(bytesToHex(result)).toBe(bytesToHex(direct));
  });

  it("supports hmacHexSync", () => {
    const result = crypto.hmacHexSync("sha256", "key", "data");
    const bytes = crypto.hmacSha256Sync("key", "data");
    expect(result).toBe(bytesToHex(bytes));
  });

  it("returns digest length synchronously", () => {
    expect(crypto.getHashDigestLengthSync("sha256")).toBe(32);
    expect(crypto.getHashDigestLengthSync("sha512")).toBe(64);
  });
});

describe("NotInitializedError", () => {
  it("throws NotInitializedError when using sync method before init", async () => {
    vi.resetModules();
    const { sha256Sync, NotInitializedError } = await import("@zig-wasm/crypto");
    expect(() => sha256Sync("test")).toThrow(NotInitializedError);
  });
});

describe("Binary Data Handling", () => {
  it("handles Uint8Array input for hashing", async () => {
    const input = new TextEncoder().encode("test data");
    const result = await crypto.sha256(input);
    const stringResult = await crypto.sha256("test data");
    expect(bytesToHex(result)).toBe(bytesToHex(stringResult));
  });

  it("handles Uint8Array input for HMAC", async () => {
    const key = new TextEncoder().encode("secret");
    const data = new TextEncoder().encode("message");
    const result = await crypto.hmacSha256(key, data);
    const stringResult = await crypto.hmacSha256("secret", "message");
    expect(bytesToHex(result)).toBe(bytesToHex(stringResult));
  });

  it("handles mixed string and Uint8Array inputs", async () => {
    const key = "secret";
    const data = new TextEncoder().encode("message");
    const result = await crypto.hmacSha256(key, data);
    const stringResult = await crypto.hmacSha256("secret", "message");
    expect(bytesToHex(result)).toBe(bytesToHex(stringResult));
  });
});

describe("Edge Cases", () => {
  it("handles empty input correctly", async () => {
    const result = await crypto.sha256("");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("handles very long input", async () => {
    const longInput = "a".repeat(10000);
    const result = await crypto.sha256(longInput);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("handles UTF-8 characters correctly", async () => {
    const utf8Input = "Hello 世界 🌍";
    const result = await crypto.sha256(utf8Input);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("produces different hashes for different inputs", async () => {
    const hash1 = await crypto.sha256("test1");
    const hash2 = await crypto.sha256("test2");
    expect(bytesToHex(hash1)).not.toBe(bytesToHex(hash2));
  });

  it("produces consistent results across multiple calls", async () => {
    const input = "consistent test";
    const hash1 = await crypto.sha256(input);
    const hash2 = await crypto.sha256(input);
    expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
  });
});

describe("HMAC Edge Cases", () => {
  it("handles empty key", async () => {
    const result = await crypto.hmacSha256("", "data");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("handles empty data", async () => {
    const result = await crypto.hmacSha256("key", "");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("handles both empty key and data", async () => {
    const result = await crypto.hmacSha256("", "");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });

  it("handles very long key (longer than block size)", async () => {
    const longKey = "k".repeat(256);
    const result = await crypto.hmacSha256(longKey, "data");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(32);
  });
});
