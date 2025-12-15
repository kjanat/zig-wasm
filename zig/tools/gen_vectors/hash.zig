//! Hash test vector generator.
//! Generates test vectors for non-cryptographic hash functions.

const std = @import("std");
const common = @import("common.zig");
const mem = common.mem;

// Helper to define hash function entries with different APIs
const HashEntry = struct {
    name: []const u8,
    hash_fn: *const fn (data: []const u8) u64,
    is_32bit: bool,
};

// Simple hash functions (no seed parameter)
const SimpleHashes = struct {
    // 32-bit hashes
    fn crc32(data: []const u8) u64 {
        return std.hash.crc.Crc32.hash(data);
    }
    fn adler32(data: []const u8) u64 {
        return std.hash.Adler32.hash(data);
    }
    fn fnv1a32(data: []const u8) u64 {
        return std.hash.Fnv1a_32.hash(data);
    }
    // 64-bit hashes (unseeded)
    fn xxhash32(data: []const u8) u64 {
        return std.hash.XxHash32.hash(0, data);
    }
    fn xxhash64(data: []const u8) u64 {
        return std.hash.XxHash64.hash(0, data);
    }
    fn wyhash(data: []const u8) u64 {
        return std.hash.Wyhash.hash(0, data);
    }
    fn cityhash64(data: []const u8) u64 {
        return std.hash.CityHash64.hash(data);
    }
    fn murmur2_64(data: []const u8) u64 {
        return std.hash.Murmur2_64.hash(data);
    }
    fn fnv1a64(data: []const u8) u64 {
        return std.hash.Fnv1a_64.hash(data);
    }
};

// Define the simple hashes to generate (order matters for JSON output)
const simple_hashes: []const HashEntry = &.{
    .{ .name = "crc32", .hash_fn = SimpleHashes.crc32, .is_32bit = true },
    .{ .name = "adler32", .hash_fn = SimpleHashes.adler32, .is_32bit = true },
    .{ .name = "xxhash32", .hash_fn = SimpleHashes.xxhash32, .is_32bit = true },
    .{ .name = "xxhash64", .hash_fn = SimpleHashes.xxhash64, .is_32bit = false },
    .{ .name = "wyhash", .hash_fn = SimpleHashes.wyhash, .is_32bit = false },
    .{ .name = "cityhash64", .hash_fn = SimpleHashes.cityhash64, .is_32bit = false },
    .{ .name = "murmur2_64", .hash_fn = SimpleHashes.murmur2_64, .is_32bit = false },
    .{ .name = "fnv1a32", .hash_fn = SimpleHashes.fnv1a32, .is_32bit = true },
    .{ .name = "fnv1a64", .hash_fn = SimpleHashes.fnv1a64, .is_32bit = false },
};

// Seeded hash types - these need inline for due to different APIs
const SeededHash32Types = .{
    .{ "xxhash32_seeded", std.hash.XxHash32 },
};

const SeededHash64Types = .{
    .{ "xxhash64_seeded", std.hash.XxHash64 },
    .{ "wyhash_seeded", std.hash.Wyhash },
};

// CityHash64 and Murmur2_64 use hashWithSeed instead of hash
const SeededHash64WithSeedTypes = .{
    .{ "cityhash64_seeded", std.hash.CityHash64 },
    .{ "murmur2_64_seeded", std.hash.Murmur2_64 },
};

pub fn writeHashVectors(allocator: mem.Allocator) ![]u8 {
    var out: std.io.Writer.Allocating = .init(allocator);
    errdefer out.deinit();

    var ws: std.json.Stringify = .{ .writer = &out.writer, .options = .{ .whitespace = .indent_2 } };

    try ws.beginObject();

    // Meta section
    try ws.objectField("_meta");
    try ws.beginObject();
    try ws.objectField("generated_by");
    try ws.write("zig/tools/gen_test_vectors.zig");
    try ws.objectField("description");
    try ws.write("Deterministic test vectors for @zig-wasm/hash");
    try ws.endObject();

    // Simple hashes (no seeds)
    for (simple_hashes) |entry| {
        try ws.objectField(entry.name);
        try ws.beginObject();
        for (common.test_inputs) |input| {
            const hash = entry.hash_fn(input.data);
            try ws.objectField(input.name);
            if (entry.is_32bit) {
                try ws.write(common.toHex32(@truncate(hash)));
            } else {
                try ws.write(common.toHex64(hash));
            }
        }
        try ws.endObject();
    }

    // Seeded 32-bit hashes
    inline for (SeededHash32Types) |entry| {
        const name = entry[0];
        const Algo = entry[1];

        try ws.objectField(name);
        try ws.beginObject();
        for (common.test_seeds_32) |seed| {
            try ws.objectField(common.seedToString(u32, seed));
            try ws.beginObject();
            for (common.test_inputs) |input| {
                const hash = Algo.hash(seed, input.data);
                try ws.objectField(input.name);
                try ws.write(common.toHex32(hash));
            }
            try ws.endObject();
        }
        try ws.endObject();
    }

    // Seeded 64-bit hashes (hash method)
    inline for (SeededHash64Types) |entry| {
        const name = entry[0];
        const Algo = entry[1];

        try ws.objectField(name);
        try ws.beginObject();
        for (common.test_seeds_64) |seed| {
            try ws.objectField(common.seedToString(u64, seed));
            try ws.beginObject();
            for (common.test_inputs) |input| {
                const hash = Algo.hash(seed, input.data);
                try ws.objectField(input.name);
                try ws.write(common.toHex64(hash));
            }
            try ws.endObject();
        }
        try ws.endObject();
    }

    // Seeded 64-bit hashes (hashWithSeed method)
    inline for (SeededHash64WithSeedTypes) |entry| {
        const name = entry[0];
        const Algo = entry[1];

        try ws.objectField(name);
        try ws.beginObject();
        for (common.test_seeds_64) |seed| {
            try ws.objectField(common.seedToString(u64, seed));
            try ws.beginObject();
            for (common.test_inputs) |input| {
                const hash = Algo.hashWithSeed(input.data, seed);
                try ws.objectField(input.name);
                try ws.write(common.toHex64(hash));
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
