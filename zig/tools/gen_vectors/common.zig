//! Common utilities and test inputs for test vector generation.

const std = @import("std");
pub const mem = std.mem;
pub const fs = std.fs;

// ============================================================================
// Test inputs - comprehensive coverage
// ============================================================================

pub const TestInput = struct {
    name: []const u8,
    data: []const u8,
};

pub const test_inputs = [_]TestInput{
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
pub const test_seeds_32 = [_]u32{ 0, 1, 42, 0xDEADBEEF };
pub const test_seeds_64 = [_]u64{ 0, 1, 42, 0xDEADBEEFCAFEBABE };

// HMAC test keys
pub const hmac_keys = [_]TestInput{
    .{ .name = "empty", .data = "" },
    .{ .name = "short", .data = "key" },
    .{ .name = "secret", .data = "secret" },
    .{ .name = "long_key", .data = "this_is_a_much_longer_key_for_hmac_testing_purposes_1234567890" },
};

// ============================================================================
// Hex conversion utilities
// ============================================================================

pub fn toHex32(value: u32) [8]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [8]u8 = undefined;
    inline for (0..8) |i| {
        const shift: u5 = @intCast(28 - i * 4);
        result[i] = hex_chars[(value >> shift) & 0xF];
    }
    return result;
}

pub fn toHex64(value: u64) [16]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [16]u8 = undefined;
    inline for (0..16) |i| {
        const shift: u6 = @intCast(60 - i * 4);
        result[i] = hex_chars[(value >> shift) & 0xF];
    }
    return result;
}

pub fn bytesToHex(comptime len: usize, bytes: *const [len]u8) [len * 2]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [len * 2]u8 = undefined;
    inline for (0..len) |i| {
        result[i * 2] = hex_chars[bytes[i] >> 4];
        result[i * 2 + 1] = hex_chars[bytes[i] & 0xF];
    }
    return result;
}

// ============================================================================
// File writing utilities
// ============================================================================

pub fn writeToFile(path: []const u8, data: []const u8) !void {
    const dir_path = fs.path.dirname(path) orelse ".";
    fs.cwd().makePath(dir_path) catch |err| {
        const stderr = fs.File.stderr();
        var buf: [256]u8 = undefined;
        const msg = std.fmt.bufPrint(&buf, "Error creating directory '{s}': {}\n", .{ dir_path, err }) catch "Error creating directory\n";
        stderr.writeAll(msg) catch {};
        return err;
    };

    const file = fs.cwd().createFile(path, .{}) catch |err| {
        const stderr = fs.File.stderr();
        var buf: [256]u8 = undefined;
        const msg = std.fmt.bufPrint(&buf, "Error creating file '{s}': {}\n", .{ path, err }) catch "Error creating file\n";
        stderr.writeAll(msg) catch {};
        return err;
    };
    defer file.close();

    try file.writeAll(data);

    const stdout = fs.File.stdout();
    var buf: [256]u8 = undefined;
    const msg = std.fmt.bufPrint(&buf, "Generated: {s}\n", .{path}) catch "Generated file\n";
    stdout.writeAll(msg) catch {};
}
