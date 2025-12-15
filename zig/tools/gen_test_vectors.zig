//! Test vector generator for hash, crypto, and math packages.
//! Generates JSON fixtures with deterministic expected outputs from Zig's stdlib.
//!
//! Run: zig build gen-test-vectors
//! Or:  zig run zig/tools/gen_test_vectors.zig -- --hash packages/hash/__tests__/fixtures/test-vectors.json
//!                                             -- --crypto packages/crypto/__tests__/fixtures/test-vectors.json
//!                                             -- --math packages/math/__tests__/fixtures/test-vectors.json

const std = @import("std");
const mem = std.mem;
const fs = std.fs;

const common = @import("gen_vectors/common.zig");
const hash = @import("gen_vectors/hash.zig");
const crypto = @import("gen_vectors/crypto.zig");
const math = @import("gen_vectors/math.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    var hash_path: ?[]const u8 = null;
    var crypto_path: ?[]const u8 = null;
    var math_path: ?[]const u8 = null;

    var i: usize = 1;
    while (i < args.len) : (i += 1) {
        if (mem.eql(u8, args[i], "--hash") and i + 1 < args.len) {
            hash_path = args[i + 1];
            i += 1;
        } else if (mem.eql(u8, args[i], "--crypto") and i + 1 < args.len) {
            crypto_path = args[i + 1];
            i += 1;
        } else if (mem.eql(u8, args[i], "--math") and i + 1 < args.len) {
            math_path = args[i + 1];
            i += 1;
        } else if (mem.eql(u8, args[i], "--help") or mem.eql(u8, args[i], "-h")) {
            const help =
                \\Usage: gen_test_vectors [OPTIONS]
                \\
                \\Generate test vector JSON fixtures for hash, crypto, and math packages.
                \\
                \\Options:
                \\  --hash <path>    Output path for hash test vectors JSON
                \\  --crypto <path>  Output path for crypto test vectors JSON
                \\  --math <path>    Output path for math test vectors JSON
                \\  --help, -h       Show this help message
                \\
                \\Example:
                \\  gen_test_vectors --hash packages/hash/__tests__/fixtures/test-vectors.json \
                \\                   --crypto packages/crypto/__tests__/fixtures/test-vectors.json \
                \\                   --math packages/math/__tests__/fixtures/test-vectors.json
                \\
            ;
            const stdout = fs.File.stdout();
            try stdout.writeAll(help);
            return;
        }
    }

    if (hash_path == null and crypto_path == null and math_path == null) {
        const stderr = fs.File.stderr();
        try stderr.writeAll("Error: At least one of --hash, --crypto, or --math must be specified.\n");
        try stderr.writeAll("Use --help for usage information.\n");
        std.process.exit(1);
    }

    if (hash_path) |path| {
        const data = try hash.writeHashVectors(allocator);
        defer allocator.free(data);
        try common.writeToFile(path, data);
    }

    if (crypto_path) |path| {
        const data = try crypto.writeCryptoVectors(allocator);
        defer allocator.free(data);
        try common.writeToFile(path, data);
    }

    if (math_path) |path| {
        const data = try math.writeMathVectors(allocator);
        defer allocator.free(data);
        try common.writeToFile(path, data);
    }
}
