//! Hash test vector generator.
//! Generates test vectors for non-cryptographic hash functions.

const std = @import("std");
const common = @import("common.zig");
const mem = common.mem;

pub fn writeHashVectors(allocator: mem.Allocator) ![]u8 {
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
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.crc.Crc32.hash(input.data);
        const hex = common.toHex32(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // Adler32
    try writer.writeAll("  \"adler32\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.Adler32.hash(input.data);
        const hex = common.toHex32(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // xxHash32 (unseeded)
    try writer.writeAll("  \"xxhash32\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.XxHash32.hash(0, input.data);
        const hex = common.toHex32(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // xxHash32 seeded
    try writer.writeAll("  \"xxhash32_seeded\": {\n");
    var first_seed32 = true;
    for (common.test_seeds_32) |seed| {
        if (!first_seed32) try writer.writeAll(",\n");
        first_seed32 = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (common.test_inputs, 0..) |input, idx| {
            const hash = std.hash.XxHash32.hash(seed, input.data);
            const hex = common.toHex32(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // xxHash64 (unseeded)
    try writer.writeAll("  \"xxhash64\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.XxHash64.hash(0, input.data);
        const hex = common.toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // xxHash64 seeded
    try writer.writeAll("  \"xxhash64_seeded\": {\n");
    var first_seed64 = true;
    for (common.test_seeds_64) |seed| {
        if (!first_seed64) try writer.writeAll(",\n");
        first_seed64 = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (common.test_inputs, 0..) |input, idx| {
            const hash = std.hash.XxHash64.hash(seed, input.data);
            const hex = common.toHex64(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // wyhash (unseeded)
    try writer.writeAll("  \"wyhash\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.Wyhash.hash(0, input.data);
        const hex = common.toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // wyhash seeded
    try writer.writeAll("  \"wyhash_seeded\": {\n");
    var first_wy = true;
    for (common.test_seeds_64) |seed| {
        if (!first_wy) try writer.writeAll(",\n");
        first_wy = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (common.test_inputs, 0..) |input, idx| {
            const hash = std.hash.Wyhash.hash(seed, input.data);
            const hex = common.toHex64(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // CityHash64 (unseeded)
    try writer.writeAll("  \"cityhash64\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.CityHash64.hash(input.data);
        const hex = common.toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // CityHash64 seeded
    try writer.writeAll("  \"cityhash64_seeded\": {\n");
    var first_city = true;
    for (common.test_seeds_64) |seed| {
        if (!first_city) try writer.writeAll(",\n");
        first_city = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (common.test_inputs, 0..) |input, idx| {
            const hash = std.hash.CityHash64.hashWithSeed(input.data, seed);
            const hex = common.toHex64(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // Murmur2_64 (unseeded)
    try writer.writeAll("  \"murmur2_64\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.Murmur2_64.hash(input.data);
        const hex = common.toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // Murmur2_64 seeded
    try writer.writeAll("  \"murmur2_64_seeded\": {\n");
    var first_murmur = true;
    for (common.test_seeds_64) |seed| {
        if (!first_murmur) try writer.writeAll(",\n");
        first_murmur = false;
        try writer.print("    \"{d}\": {{\n", .{seed});
        for (common.test_inputs, 0..) |input, idx| {
            const hash = std.hash.Murmur2_64.hashWithSeed(input.data, seed);
            const hex = common.toHex64(hash);
            try writer.print("      \"{s}\": \"{s}\"", .{ input.name, hex });
            if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
            try writer.writeAll("\n");
        }
        try writer.writeAll("    }");
    }
    try writer.writeAll("\n  },\n");

    // FNV-1a 32-bit
    try writer.writeAll("  \"fnv1a32\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.Fnv1a_32.hash(input.data);
        const hex = common.toHex32(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // FNV-1a 64-bit
    try writer.writeAll("  \"fnv1a64\": {\n");
    for (common.test_inputs, 0..) |input, idx| {
        const hash = std.hash.Fnv1a_64.hash(input.data);
        const hex = common.toHex64(hash);
        try writer.print("    \"{s}\": \"{s}\"", .{ input.name, hex });
        if (idx < common.test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  }\n");

    try writer.writeAll("}\n");

    return list.toOwnedSlice(allocator);
}
