///! Base64 encoding/decoding for WASM export
///! Wraps Zig's std.base64 module
const std = @import("std");
const allocator_mod = @import("allocator.zig");

// Re-export allocator functions
export fn alloc(size: usize) ?[*]u8 {
    return allocator_mod.alloc(size);
}
export fn free(ptr: [*]u8, size: usize) void {
    allocator_mod.free(ptr, size);
}

const standard = std.base64.standard;
const standard_no_pad = std.base64.standard_no_pad;
const url_safe = std.base64.url_safe;
const url_safe_no_pad = std.base64.url_safe_no_pad;

// ============================================================================
// Standard Base64 (with padding)
// ============================================================================

/// Get encoded length for standard base64
export fn base64_encode_len(input_len: usize) usize {
    return standard.Encoder.calcSize(input_len);
}

/// Encode data to standard base64
/// out_ptr must have at least base64_encode_len(data_len) bytes
export fn base64_encode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
) usize {
    const data = data_ptr[0..data_len];
    const encoded_len = standard.Encoder.calcSize(data_len);
    const out = out_ptr[0..encoded_len];
    _ = standard.Encoder.encode(out, data);
    return encoded_len;
}

/// Get maximum decoded length for standard base64
export fn base64_decode_len(input_len: usize) usize {
    // Max decoded size is 3/4 of encoded size
    return (input_len / 4) * 3;
}

/// Decode standard base64 data
/// Returns actual decoded length, or 0 on error
export fn base64_decode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
    out_len: usize,
) usize {
    const data = data_ptr[0..data_len];
    const out = out_ptr[0..out_len];

    standard.Decoder.decode(out, data) catch return 0;
    // Calculate actual decoded length
    var padding: usize = 0;
    if (data_len > 0 and data[data_len - 1] == '=') padding += 1;
    if (data_len > 1 and data[data_len - 2] == '=') padding += 1;
    return (data_len / 4) * 3 - padding;
}

// ============================================================================
// Standard Base64 (no padding)
// ============================================================================

/// Get encoded length for base64 without padding
export fn base64_no_pad_encode_len(input_len: usize) usize {
    return standard_no_pad.Encoder.calcSize(input_len);
}

/// Encode data to base64 without padding
export fn base64_no_pad_encode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
) usize {
    const data = data_ptr[0..data_len];
    const encoded_len = standard_no_pad.Encoder.calcSize(data_len);
    const out = out_ptr[0..encoded_len];
    _ = standard_no_pad.Encoder.encode(out, data);
    return encoded_len;
}

/// Decode base64 without padding
export fn base64_no_pad_decode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
    out_len: usize,
) usize {
    const data = data_ptr[0..data_len];
    const out = out_ptr[0..out_len];

    standard_no_pad.Decoder.decode(out, data) catch return 0;
    // For no-padding, calculate from encoded length
    const remainder = data_len % 4;
    const full_groups = data_len / 4;
    const extra_bytes: usize = switch (remainder) {
        0 => 0,
        2 => 1,
        3 => 2,
        else => 0,
    };
    return full_groups * 3 + extra_bytes;
}

// ============================================================================
// URL-safe Base64 (with padding)
// ============================================================================

/// Get encoded length for URL-safe base64
export fn base64_url_encode_len(input_len: usize) usize {
    return url_safe.Encoder.calcSize(input_len);
}

/// Encode data to URL-safe base64
export fn base64_url_encode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
) usize {
    const data = data_ptr[0..data_len];
    const encoded_len = url_safe.Encoder.calcSize(data_len);
    const out = out_ptr[0..encoded_len];
    _ = url_safe.Encoder.encode(out, data);
    return encoded_len;
}

/// Decode URL-safe base64
export fn base64_url_decode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
    out_len: usize,
) usize {
    const data = data_ptr[0..data_len];
    const out = out_ptr[0..out_len];

    url_safe.Decoder.decode(out, data) catch return 0;
    var padding: usize = 0;
    if (data_len > 0 and data[data_len - 1] == '=') padding += 1;
    if (data_len > 1 and data[data_len - 2] == '=') padding += 1;
    return (data_len / 4) * 3 - padding;
}

// ============================================================================
// URL-safe Base64 (no padding)
// ============================================================================

/// Get encoded length for URL-safe base64 without padding
export fn base64_url_no_pad_encode_len(input_len: usize) usize {
    return url_safe_no_pad.Encoder.calcSize(input_len);
}

/// Encode data to URL-safe base64 without padding
export fn base64_url_no_pad_encode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
) usize {
    const data = data_ptr[0..data_len];
    const encoded_len = url_safe_no_pad.Encoder.calcSize(data_len);
    const out = out_ptr[0..encoded_len];
    _ = url_safe_no_pad.Encoder.encode(out, data);
    return encoded_len;
}

/// Decode URL-safe base64 without padding
export fn base64_url_no_pad_decode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
    out_len: usize,
) usize {
    const data = data_ptr[0..data_len];
    const out = out_ptr[0..out_len];

    url_safe_no_pad.Decoder.decode(out, data) catch return 0;
    const remainder = data_len % 4;
    const full_groups = data_len / 4;
    const extra_bytes: usize = switch (remainder) {
        0 => 0,
        2 => 1,
        3 => 2,
        else => 0,
    };
    return full_groups * 3 + extra_bytes;
}

// ============================================================================
// Hex encoding
// ============================================================================

/// Get hex encoded length
export fn hex_encode_len(input_len: usize) usize {
    return input_len * 2;
}

/// Encode data to lowercase hex
export fn hex_encode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
) usize {
    const data = data_ptr[0..data_len];
    const out = out_ptr[0 .. data_len * 2];

    const hex_chars = "0123456789abcdef";
    for (data, 0..) |byte, i| {
        out[i * 2] = hex_chars[byte >> 4];
        out[i * 2 + 1] = hex_chars[byte & 0x0F];
    }

    return data_len * 2;
}

/// Get hex decoded length
export fn hex_decode_len(input_len: usize) usize {
    return input_len / 2;
}

/// Decode hex string to bytes
/// Returns actual decoded length, or 0 on error
export fn hex_decode(
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
) usize {
    if (data_len % 2 != 0) return 0;

    const data = data_ptr[0..data_len];
    const out = out_ptr[0 .. data_len / 2];

    for (0..data_len / 2) |i| {
        const high = hexCharToNibble(data[i * 2]) orelse return 0;
        const low = hexCharToNibble(data[i * 2 + 1]) orelse return 0;
        out[i] = (high << 4) | low;
    }

    return data_len / 2;
}

fn hexCharToNibble(c: u8) ?u8 {
    return switch (c) {
        '0'...'9' => c - '0',
        'a'...'f' => c - 'a' + 10,
        'A'...'F' => c - 'A' + 10,
        else => null,
    };
}
