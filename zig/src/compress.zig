///! Compression/decompression functions for WASM export
///! Wraps Zig's std.compress module
///! Note: Uses simplified streaming API
const std = @import("std");
const allocator_mod = @import("allocator.zig");

const Allocator = std.mem.Allocator;

fn getAllocator() Allocator {
    return allocator_mod.getAllocator();
}

// Re-export allocator functions
export fn alloc(size: usize) ?[*]u8 {
    return allocator_mod.alloc(size);
}
export fn free(ptr: [*]u8, size: usize) void {
    allocator_mod.free(ptr, size);
}

const flate = std.compress.flate;

// ============================================================================
// LZMA2/XZ (decompression only)
// ============================================================================

/// Decompress xz data
export fn xz_decompress(
    data_ptr: [*]const u8,
    data_len: usize,
    out_len_ptr: *usize,
) ?[*]u8 {
    const allocator = getAllocator();
    const data = data_ptr[0..data_len];

    var stream = std.io.fixedBufferStream(data);
    var decompressor = std.compress.xz.decompress(allocator, stream.reader()) catch return null;
    defer decompressor.deinit();

    const result = decompressor.reader().readAllAlloc(allocator, std.math.maxInt(usize)) catch return null;
    out_len_ptr.* = result.len;
    return result.ptr;
}

// ============================================================================
// LZMA (decompression only)
// ============================================================================

/// Decompress lzma data
export fn lzma_decompress(
    data_ptr: [*]const u8,
    data_len: usize,
    out_len_ptr: *usize,
) ?[*]u8 {
    const allocator = getAllocator();
    const data = data_ptr[0..data_len];

    var stream = std.io.fixedBufferStream(data);
    var decompressor = std.compress.lzma.decompress(allocator, stream.reader()) catch return null;
    defer decompressor.deinit();

    const result = decompressor.reader().readAllAlloc(allocator, std.math.maxInt(usize)) catch return null;
    out_len_ptr.* = result.len;
    return result.ptr;
}
