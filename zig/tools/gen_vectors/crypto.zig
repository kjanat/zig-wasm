//! Crypto test vector generator.
//! Generates test vectors for cryptographic hash functions and HMACs.

const std = @import("std");

const common = @import("common.zig");
const mem = common.mem;

// Define tuples mapping the JSON key to the Zig Standard Library type
const HashTypes = .{
    .{ "md5", std.crypto.hash.Md5 },
    .{ "sha1", std.crypto.hash.Sha1 },
    .{ "sha256", std.crypto.hash.sha2.Sha256 },
    .{ "sha384", std.crypto.hash.sha2.Sha384 },
    .{ "sha512", std.crypto.hash.sha2.Sha512 },
    .{ "sha3_256", std.crypto.hash.sha3.Sha3_256 },
    .{ "sha3_512", std.crypto.hash.sha3.Sha3_512 },
    .{ "blake2b256", std.crypto.hash.blake2.Blake2b256 },
    .{ "blake2s256", std.crypto.hash.blake2.Blake2s256 },
    .{ "blake3", std.crypto.hash.Blake3 },
};

const HmacTypes = .{
    .{ "hmac_sha256", std.crypto.auth.hmac.sha2.HmacSha256 },
    .{ "hmac_sha512", std.crypto.auth.hmac.sha2.HmacSha512 },
};

pub fn writeCryptoVectors(allocator: mem.Allocator) ![]u8 {
    var out: std.io.Writer.Allocating = .init(allocator);
    errdefer out.deinit();

    // Create a JSON writer that handles formatting and syntax automatically
    var ws: std.json.Stringify = .{ .writer = &out.writer, .options = .{ .whitespace = .indent_2 } };

    try ws.beginObject();

    // 1. Meta Section
    try ws.objectField("_meta");
    try ws.beginObject();
    try ws.objectField("generated_by");
    try ws.write("zig/tools/gen_test_vectors.zig");
    try ws.objectField("description");
    try ws.write("Deterministic test vectors for @zig-wasm/crypto");
    try ws.endObject();

    // 2. Hash Functions Loop
    // 'inline for' unrolls this loop at compile time, generating code for each type
    inline for (HashTypes) |entry| {
        const name = entry[0];
        const Algo = entry[1];

        try ws.objectField(name);
        try ws.beginObject();
        for (common.test_inputs) |input| {
            var digest: [Algo.digest_length]u8 = undefined;
            Algo.hash(input.data, &digest, .{});

            try ws.objectField(input.name);
            try ws.write(common.bytesToHex(Algo.digest_length, &digest));
        }
        try ws.endObject();
    }

    // 3. HMAC Functions Loop
    inline for (HmacTypes) |entry| {
        const name = entry[0];
        const Algo = entry[1];

        try ws.objectField(name);
        try ws.beginObject();

        for (common.hmac_keys) |key_input| {
            try ws.objectField(key_input.name);
            try ws.beginObject();

            for (common.test_inputs) |input| {
                var mac: [Algo.mac_length]u8 = undefined;
                Algo.create(&mac, input.data, key_input.data);

                try ws.objectField(input.name);
                try ws.write(common.bytesToHex(Algo.mac_length, &mac));
            }
            try ws.endObject();
        }
        try ws.endObject();
    }

    try ws.endObject();

    // Add trailing newline for POSIX compliance
    try out.writer.writeByte('\n');

    return out.toOwnedSlice();
}
