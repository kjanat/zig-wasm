//! Compression and decompression functions for WASM export.
//!
//! Provides decompression support for LZMA-based formats:
//! - **XZ**: Container format with LZMA2 compression (`.xz` files)
//! - **LZMA**: Raw LZMA compressed data (`.lzma` files)
//!
//! Note: Only decompression is currently supported. Compression requires
//! significant memory and is not yet implemented for WASM targets.
//!
//! Memory is allocated dynamically for decompressed output. Callers must
//! free the returned buffer using `free()` when done.

const std = @import("std");
const allocator_mod = @import("allocator.zig");

const Allocator = std.mem.Allocator;

/// Returns the WASM allocator for internal use.
fn getAllocator() Allocator {
    return allocator_mod.getAllocator();
}

/// Allocates memory in WASM linear memory.
///
/// Returns a pointer to the allocated region, or null if allocation fails.
export fn alloc(size: usize) ?[*]u8 {
    return allocator_mod.alloc(size);
}

/// Frees previously allocated WASM memory.
export fn free(ptr: [*]u8, size: usize) void {
    allocator_mod.free(ptr, size);
}

const flate = std.compress.flate;

// ============================================================================
// LZMA2/XZ (decompression only)
// ============================================================================

/// Decompresses XZ-format data (LZMA2 with container).
///
/// XZ is a container format that includes integrity checks and metadata.
/// This function allocates memory for the output; the caller must free it.
///
/// Returns a pointer to the decompressed data, or null on error.
/// The actual decompressed length is written to `out_len_ptr`.
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

/// Decompresses raw LZMA data.
///
/// LZMA is the compression algorithm; this handles raw streams without
/// the XZ container format. Use `xz_decompress()` for `.xz` files.
///
/// Returns a pointer to the decompressed data, or null on error.
/// The actual decompressed length is written to `out_len_ptr`.
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
