//! Test vector generator for hash and crypto packages.
//! Generates JSON fixtures with deterministic expected outputs from Zig's stdlib.
//!
//! Run: zig build gen-test-vectors
//! Or:  zig run zig/tools/gen_test_vectors.zig -- --hash packages/hash/__tests__/fixtures/test-vectors.json
//!                                              -- --crypto packages/crypto/__tests__/fixtures/test-vectors.json

const std = @import("std");
const fs = std.fs;
const mem = std.mem;

// ============================================================================
// Test inputs - comprehensive coverage
// ============================================================================

const TestInput = struct {
    name: []const u8,
    data: []const u8,
};

const test_inputs = [_]TestInput{
    // Basic strings
    .{ .name = "empty", .data = "" },
    .{ .name = "test", .data = "test" },
    .{ .name = "hello", .data = "hello" },
    .{ .name = "123456789", .data = "123456789" }, // Classic CRC test vector

    // Single characters
    .{ .name = "single_a", .data = "a" },
    .{ .name = "single_null", .data = "\x00" },
    .{ .name = "single_ff", .data = "\xff" },

    // Common phrases
    .{ .name = "hello_world", .data = "Hello, World!" },
    .{ .name = "quick_brown_fox", .data = "The quick brown fox jumps over the lazy dog" },
    .{ .name = "pangram_lower", .data = "the quick brown fox jumps over the lazy dog" },

    // Unicode / UTF-8
    .{ .name = "unicode_emoji", .data = "\xf0\x9f\x98\x80" }, // U+1F600 grinning face
    .{ .name = "unicode_chinese", .data = "\xe4\xb8\xad\xe6\x96\x87" }, // Chinese characters
    .{ .name = "unicode_mixed", .data = "Hello \xe4\xb8\x96\xe7\x95\x8c \xf0\x9f\x8c\x8d" }, // "Hello world globe"
    .{ .name = "unicode_zalgo", .data = "Z\xcc\xa4\xcc\xab\xcc\xa4a\xcd\x95\xcc\xa4l\xcd\x96\xcc\xabg\xcc\xa4o\xcc\xab" },

    // Binary patterns
    .{ .name = "all_zeros_8", .data = "\x00\x00\x00\x00\x00\x00\x00\x00" },
    .{ .name = "all_ones_8", .data = "\xff\xff\xff\xff\xff\xff\xff\xff" },
    .{ .name = "ascending_bytes", .data = "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f" },
    .{ .name = "descending_bytes", .data = "\xff\xfe\xfd\xfc\xfb\xfa\xf9\xf8\xf7\xf6\xf5\xf4\xf3\xf2\xf1\xf0" },

    // Repeated patterns
    .{ .name = "repeat_a_16", .data = "aaaaaaaaaaaaaaaa" },
    .{ .name = "repeat_ab_16", .data = "abababababababab" },
    .{ .name = "repeat_abc_15", .data = "abcabcabcabcabc" },

    // Edge cases for hash alignment
    .{ .name = "len_1", .data = "x" },
    .{ .name = "len_7", .data = "1234567" },
    .{ .name = "len_8", .data = "12345678" },
    .{ .name = "len_15", .data = "123456789012345" },
    .{ .name = "len_16", .data = "1234567890123456" },
    .{ .name = "len_31", .data = "1234567890123456789012345678901" },
    .{ .name = "len_32", .data = "12345678901234567890123456789012" },
    .{ .name = "len_63", .data = "123456789012345678901234567890123456789012345678901234567890123" },
    .{ .name = "len_64", .data = "1234567890123456789012345678901234567890123456789012345678901234" },

    // Whitespace variations
    .{ .name = "spaces", .data = "   " },
    .{ .name = "tabs", .data = "\t\t\t" },
    .{ .name = "newlines", .data = "\n\n\n" },
    .{ .name = "mixed_whitespace", .data = " \t\n\r " },

    // Special characters
    .{ .name = "special_chars", .data = "!@#$%^&*()_+-=[]{}|;':\",./<>?" },
    .{ .name = "backslashes", .data = "\\\\\\path\\to\\file" },
    .{ .name = "json_like", .data = "{\"key\": \"value\", \"num\": 123}" },
    .{ .name = "xml_like", .data = "<root><child attr=\"val\">text</child></root>" },

    // Long-ish inputs (not too long to keep fixture small)
    .{ .name = "lorem_128", .data = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua sed." },

    // Pathological inputs
    .{ .name = "null_in_middle", .data = "before\x00after" },
    .{ .name = "many_nulls", .data = "\x00\x00\x00\x00\x00" },
    .{ .name = "high_entropy", .data = "\x7f\x45\x4c\x46\x02\x01\x01\x00" }, // ELF header start
};

// Seeds for seeded hash functions
const test_seeds_32 = [_]u32{ 0, 1, 42, 0xDEADBEEF };
const test_seeds_64 = [_]u64{ 0, 1, 42, 0xDEADBEEFCAFEBABE };

// HMAC test keys
const hmac_keys = [_]TestInput{
    .{ .name = "empty", .data = "" },
    .{ .name = "short", .data = "key" },
    .{ .name = "secret", .data = "secret" },
    .{ .name = "long_key", .data = "this_is_a_much_longer_key_for_hmac_testing_purposes_1234567890" },
};

// ============================================================================
// Hash algorithms (non-cryptographic)
// ============================================================================

fn toHex32(value: u32) [8]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [8]u8 = undefined;
    inline for (0..8) |i| {
        const shift: u5 = @intCast(28 - i * 4);
        result[i] = hex_chars[(value >> shift) & 0xF];
    }
    return result;
}

fn toHex64(value: u64) [16]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [16]u8 = undefined;
    inline for (0..16) |i| {
        const shift: u6 = @intCast(60 - i * 4);
        result[i] = hex_chars[(value >> shift) & 0xF];
    }
    return result;
}

fn bytesToHex(comptime len: usize, bytes: *const [len]u8) [len * 2]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [len * 2]u8 = undefined;
    inline for (0..len) |i| {
        result[i * 2] = hex_chars[bytes[i] >> 4];
        result[i * 2 + 1] = hex_chars[bytes[i] & 0xF];
    }
    return result;
}

fn writeHashVectors(allocator: mem.Allocator) ![]u8 {
    var list = std.ArrayListUnmanaged(u8){};
    errdefer list.deinit(allocator);
    const writer = list.writer(allocator);

    try writer.writeAll("{\n");
    try writer.writeAll("  \"_meta\": {\n");
    try writer.writeAll("    \"generated_by\": \"zig/tools/gen_test_vectors.zig\",\n");
    try writer.writeAll("    \"description\": \"Deterministic test vectors for @zig-wasm/hash\"\n");
    try writer.writeAll("  },\n");

    // CRC32
    try writer.writeAll("  \"crc32\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.crc.Crc32.hash(input.data);
        const hex = toHex32(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // Adler32
    try writer.writeAll("  \"adler32\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.Adler32.hash(input.data);
        const hex = toHex32(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // xxHash32 (unseeded)
    try writer.writeAll("  \"xxhash32\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.XxHash32.hash(0, input.data);
        const hex = toHex32(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // xxHash32 seeded
    try writer.writeAll("  \"xxhash32_seeded\": {\n");
    var first_seed32 = true;
    for (test_seeds_32) |seed| {
        if (!first_seed32) try writer.writeAll(",\n");
        first_seed32 = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (test_inputs, 0..) |input, idx| {
            const hash = std.hash.XxHash32.hash(seed, input.data);
            const hex = toHex32(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // xxHash64 (unseeded)
    try writer.writeAll("  \"xxhash64\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.XxHash64.hash(0, input.data);
        const hex = toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // xxHash64 seeded
    try writer.writeAll("  \"xxhash64_seeded\": {\n");
    var first_seed64 = true;
    for (test_seeds_64) |seed| {
        if (!first_seed64) try writer.writeAll(",\n");
        first_seed64 = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (test_inputs, 0..) |input, idx| {
            const hash = std.hash.XxHash64.hash(seed, input.data);
            const hex = toHex64(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // wyhash (unseeded)
    try writer.writeAll("  \"wyhash\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.Wyhash.hash(0, input.data);
        const hex = toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // wyhash seeded
    try writer.writeAll("  \"wyhash_seeded\": {\n");
    var first_wy = true;
    for (test_seeds_64) |seed| {
        if (!first_wy) try writer.writeAll(",\n");
        first_wy = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (test_inputs, 0..) |input, idx| {
            const hash = std.hash.Wyhash.hash(seed, input.data);
            const hex = toHex64(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // CityHash64 (unseeded)
    try writer.writeAll("  \"cityhash64\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.CityHash64.hash(input.data);
        const hex = toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // CityHash64 seeded
    try writer.writeAll("  \"cityhash64_seeded\": {\n");
    var first_city = true;
    for (test_seeds_64) |seed| {
        if (!first_city) try writer.writeAll(",\n");
        first_city = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (test_inputs, 0..) |input, idx| {
            const hash = std.hash.CityHash64.hashWithSeed(input.data, seed);
            const hex = toHex64(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // Murmur2_64 (unseeded)
    try writer.writeAll("  \"murmur2_64\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.Murmur2_64.hash(input.data);
        const hex = toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // Murmur2_64 seeded
    try writer.writeAll("  \"murmur2_64_seeded\": {\n");
    var first_murmur = true;
    for (test_seeds_64) |seed| {
        if (!first_murmur) try writer.writeAll(",\n");
        first_murmur = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (test_inputs, 0..) |input, idx| {
            const hash = std.hash.Murmur2_64.hashWithSeed(input.data, seed);
            const hex = toHex64(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // FNV-1a 32-bit
    try writer.writeAll("  \"fnv1a32\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.Fnv1a_32.hash(input.data);
        const hex = toHex32(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // FNV-1a 64-bit
    try writer.writeAll("  \"fnv1a64\": {\n");
    for (test_inputs, 0..) |input, idx| {
        const hash = std.hash.Fnv1a_64.hash(input.data);
        const hex = toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  }\n");

    try writer.writeAll("}\n");

    return list.toOwnedSlice(allocator);
}

fn writeCryptoVectors(allocator: mem.Allocator) ![]u8 {
    var list = std.ArrayListUnmanaged(u8){};
    errdefer list.deinit(allocator);
    const writer = list.writer(allocator);

    try writer.writeAll("{\n");
    try writer.writeAll("  \"_meta\": {\n");
    try writer.writeAll("    \"generated_by\": \"zig/tools/gen_test_vectors.zig\",\n");
    try writer.writeAll("    \"description\": \"Deterministic test vectors for @zig-wasm/crypto\"\n");
    try writer.writeAll("  },\n");

    // MD5
    try writer.writeAll("  \"md5\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.Md5.digest_length]u8 = undefined;
        std.crypto.hash.Md5.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.Md5.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA1
    try writer.writeAll("  \"sha1\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.Sha1.digest_length]u8 = undefined;
        std.crypto.hash.Sha1.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.Sha1.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA256
    try writer.writeAll("  \"sha256\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha2.Sha256.digest_length]u8 = undefined;
        std.crypto.hash.sha2.Sha256.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.sha2.Sha256.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA384
    try writer.writeAll("  \"sha384\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha2.Sha384.digest_length]u8 = undefined;
        std.crypto.hash.sha2.Sha384.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.sha2.Sha384.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA512
    try writer.writeAll("  \"sha512\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha2.Sha512.digest_length]u8 = undefined;
        std.crypto.hash.sha2.Sha512.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.sha2.Sha512.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA3-256
    try writer.writeAll("  \"sha3_256\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha3.Sha3_256.digest_length]u8 = undefined;
        std.crypto.hash.sha3.Sha3_256.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.sha3.Sha3_256.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA3-512
    try writer.writeAll("  \"sha3_512\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha3.Sha3_512.digest_length]u8 = undefined;
        std.crypto.hash.sha3.Sha3_512.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.sha3.Sha3_512.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // BLAKE2b-256
    try writer.writeAll("  \"blake2b256\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.blake2.Blake2b256.digest_length]u8 = undefined;
        std.crypto.hash.blake2.Blake2b256.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.blake2.Blake2b256.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // BLAKE2s-256
    try writer.writeAll("  \"blake2s256\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.blake2.Blake2s256.digest_length]u8 = undefined;
        std.crypto.hash.blake2.Blake2s256.hash(input.data, &digest, .{});
        const hex = bytesToHex(std.crypto.hash.blake2.Blake2s256.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // BLAKE3
    try writer.writeAll("  \"blake3\": {\n");
    for (test_inputs, 0..) |input, idx| {
        var hasher = std.crypto.hash.Blake3.init(.{});
        hasher.update(input.data);
        var digest: [32]u8 = undefined;
        hasher.final(&digest);
        const hex = bytesToHex(32, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // HMAC-SHA256
    try writer.writeAll("  \"hmac_sha256\": {\n");
    var first_hmac256 = true;
    for (hmac_keys) |key_input| {
        if (!first_hmac256) try writer.writeAll(",\n");
        first_hmac256 = false;
        try writer.print("    \"{s}\": {{\n", .{key_input.name});
        for (test_inputs, 0..) |input, idx| {
            const HmacSha256 = std.crypto.auth.hmac.sha2.HmacSha256;
            var mac: [HmacSha256.mac_length]u8 = undefined;
            HmacSha256.create(&mac, input.data, key_input.data);
            const hex = bytesToHex(HmacSha256.mac_length, &mac);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // HMAC-SHA512
    try writer.writeAll("  \"hmac_sha512\": {\n");
    var first_hmac512 = true;
    for (hmac_keys) |key_input| {
        if (!first_hmac512) try writer.writeAll(",\n");
        first_hmac512 = false;
        try writer.print("    \"{s}\": {{\n", .{key_input.name});
        for (test_inputs, 0..) |input, idx| {
            const HmacSha512 = std.crypto.auth.hmac.sha2.HmacSha512;
            var mac: [HmacSha512.mac_length]u8 = undefined;
            HmacSha512.create(&mac, input.data, key_input.data);
            const hex = bytesToHex(HmacSha512.mac_length, &mac);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  }\n");

    try writer.writeAll("}\n");

    return list.toOwnedSlice(allocator);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    var hash_path: ?[]const u8 = null;
    var crypto_path: ?[]const u8 = null;

    var i: usize = 1;
    while (i < args.len) : (i += 1) {
        if (mem.eql(u8, args[i], "--hash") and i + 1 < args.len) {
            hash_path = args[i + 1];
            i += 1;
        } else if (mem.eql(u8, args[i], "--crypto") and i + 1 < args.len) {
            crypto_path = args[i + 1];
            i += 1;
        } else if (mem.eql(u8, args[i], "--help") or mem.eql(u8, args[i], "-h")) {
            const help =
                \\Usage: gen_test_vectors [OPTIONS]
                \\
                \\Generate test vector JSON fixtures for hash and crypto packages.
                \\
                \\Options:
                \\  --hash <path>    Output path for hash test vectors JSON
                \\  --crypto <path>  Output path for crypto test vectors JSON
                \\  --help, -h       Show this help message
                \\
                \\Example:
                \\  gen_test_vectors --hash packages/hash/__tests__/fixtures/test-vectors.json \
                \\                   --crypto packages/crypto/__tests__/fixtures/test-vectors.json
                \\
            ;
            const stdout = fs.File.stdout();
            try stdout.writeAll(help);
            return;
        }
    }

    if (hash_path == null and crypto_path == null) {
        const stderr = fs.File.stderr();
        try stderr.writeAll("Error: At least one of --hash or --crypto must be specified.\n");
        try stderr.writeAll("Use --help for usage information.\n");
        std.process.exit(1);
    }

    if (hash_path) |path| {
        const dir_path = fs.path.dirname(path) orelse ".";
        fs.cwd().makePath(dir_path) catch |err| {
            const stderr = fs.File.stderr();
            var buf: [256]u8 = undefined;
            const msg = std.fmt.bufPrint(&buf, "Error creating directory '{s}': {}\n", .{ dir_path, err }) catch "Error creating directory\n";
            stderr.writeAll(msg) catch {};
            std.process.exit(1);
        };

        const data = try writeHashVectors(allocator);
        defer allocator.free(data);

        const file = fs.cwd().createFile(path, .{}) catch |err| {
            const stderr = fs.File.stderr();
            var buf: [256]u8 = undefined;
            const msg = std.fmt.bufPrint(&buf, "Error creating file '{s}': {}\n", .{ path, err }) catch "Error creating file\n";
            stderr.writeAll(msg) catch {};
            std.process.exit(1);
        };
        defer file.close();

        try file.writeAll(data);

        const stdout = fs.File.stdout();
        var buf: [256]u8 = undefined;
        const msg = std.fmt.bufPrint(&buf, "Generated hash test vectors: {s}\n", .{path}) catch "Generated hash test vectors\n";
        try stdout.writeAll(msg);
    }

    if (crypto_path) |path| {
        const dir_path = fs.path.dirname(path) orelse ".";
        fs.cwd().makePath(dir_path) catch |err| {
            const stderr = fs.File.stderr();
            var buf: [256]u8 = undefined;
            const msg = std.fmt.bufPrint(&buf, "Error creating directory '{s}': {}\n", .{ dir_path, err }) catch "Error creating directory\n";
            stderr.writeAll(msg) catch {};
            std.process.exit(1);
        };

        const data = try writeCryptoVectors(allocator);
        defer allocator.free(data);

        const file = fs.cwd().createFile(path, .{}) catch |err| {
            const stderr = fs.File.stderr();
            var buf: [256]u8 = undefined;
            const msg = std.fmt.bufPrint(&buf, "Error creating file '{s}': {}\n", .{ path, err }) catch "Error creating file\n";
            stderr.writeAll(msg) catch {};
            std.process.exit(1);
        };
        defer file.close();

        try file.writeAll(data);

        const stdout = fs.File.stdout();
        var buf: [256]u8 = undefined;
        const msg = std.fmt.bufPrint(&buf, "Generated crypto test vectors: {s}\n", .{path}) catch "Generated crypto test vectors\n";
        try stdout.writeAll(msg);
    }
}
