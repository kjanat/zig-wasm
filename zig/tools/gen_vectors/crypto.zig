//! Crypto test vector generator.
//! Generates test vectors for cryptographic hash functions and HMACs.

const std = @import("std");
const common = @import("common.zig");
const mem = common.mem;

pub fn writeCryptoVectors(allocator: mem.Allocator) ![]u8 {
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
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.Md5.digest_length]u8 = undefined;
        std.crypto.hash.Md5.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.Md5.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA1
    try writer.writeAll("  \"sha1\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.Sha1.digest_length]u8 = undefined;
        std.crypto.hash.Sha1.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.Sha1.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA256
    try writer.writeAll("  \"sha256\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha2.Sha256.digest_length]u8 = undefined;
        std.crypto.hash.sha2.Sha256.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.sha2.Sha256.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA384
    try writer.writeAll("  \"sha384\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha2.Sha384.digest_length]u8 = undefined;
        std.crypto.hash.sha2.Sha384.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.sha2.Sha384.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA512
    try writer.writeAll("  \"sha512\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha2.Sha512.digest_length]u8 = undefined;
        std.crypto.hash.sha2.Sha512.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.sha2.Sha512.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA3-256
    try writer.writeAll("  \"sha3_256\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha3.Sha3_256.digest_length]u8 = undefined;
        std.crypto.hash.sha3.Sha3_256.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.sha3.Sha3_256.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // SHA3-512
    try writer.writeAll("  \"sha3_512\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.sha3.Sha3_512.digest_length]u8 = undefined;
        std.crypto.hash.sha3.Sha3_512.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.sha3.Sha3_512.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // BLAKE2b-256
    try writer.writeAll("  \"blake2b256\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.blake2.Blake2b256.digest_length]u8 = undefined;
        std.crypto.hash.blake2.Blake2b256.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.blake2.Blake2b256.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // BLAKE2s-256
    try writer.writeAll("  \"blake2s256\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var digest: [std.crypto.hash.blake2.Blake2s256.digest_length]u8 = undefined;
        std.crypto.hash.blake2.Blake2s256.hash(input.data, &digest, .{});
        const hex = common.bytesToHex(std.crypto.hash.blake2.Blake2s256.digest_length, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // BLAKE3
    try writer.writeAll("  \"blake3\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        var hasher = std.crypto.hash.Blake3.init(.{});
        hasher.update(input.data);
        var digest: [32]u8 = undefined;
        hasher.final(&digest);
        const hex = common.bytesToHex(32, &digest);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // HMAC-SHA256
    try writer.writeAll("  \"hmac_sha256\": {\n");
    var first_hmac256 = true;
    for (common.hmac_keys) |key_input| {
        if (!first_hmac256) try writer.writeAll(",\n");
        first_hmac256 = false;
        try writer.print("    \"{s}\": {{\n", .{key_input.name});
        for (common.test_inputs, 0..) |input, idx| {
            const HmacSha256 = std.crypto.auth.hmac.sha2.HmacSha256;
            var mac: [HmacSha256.mac_length]u8 = undefined;
            HmacSha256.create(&mac, input.data, key_input.data);
            const hex = common.bytesToHex(HmacSha256.mac_length, &mac);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // HMAC-SHA512
    try writer.writeAll("  \"hmac_sha512\": {\n");
    var first_hmac512 = true;
    for (common.hmac_keys) |key_input| {
        if (!first_hmac512) try writer.writeAll(",\n");
        first_hmac512 = false;
        try writer.print("    \"{s}\": {{\n", .{key_input.name});
        for (common.test_inputs, 0..) |input, idx| {
            const HmacSha512 = std.crypto.auth.hmac.sha2.HmacSha512;
            var mac: [HmacSha512.mac_length]u8 = undefined;
            HmacSha512.create(&mac, input.data, key_input.data);
            const hex = common.bytesToHex(HmacSha512.mac_length, &mac);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  }\n");

    try writer.writeAll("}\n");

    return list.toOwnedSlice(allocator);
}
