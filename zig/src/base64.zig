//! Base64 and hexadecimal encoding/decoding for WASM export.
//!
//! Provides RFC 4648-compliant Base64 encoding with four variants:
//! - **Standard**: Uses `+/` with `=` padding (RFC 4648 Section 4)
//! - **Standard no-pad**: Uses `+/` without padding
//! - **URL-safe**: Uses `-_` with `=` padding (RFC 4648 Section 5)
//! - **URL-safe no-pad**: Uses `-_` without padding
//!
//! Also includes lowercase hexadecimal encoding/decoding utilities.
//!
//! All functions use WASM linear memory for data transfer. Callers must
//! allocate output buffers using `alloc()` and free them with `free()`.

const std = @import("std");
const allocator_mod = @import("allocator.zig");

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

const standard = std.base64.standard;
const standard_no_pad = std.base64.standard_no_pad;
const url_safe = std.base64.url_safe;
const url_safe_no_pad = std.base64.url_safe_no_pad;

// ============================================================================
// Standard Base64 (with padding)
// ============================================================================

/// Returns the encoded length for standard Base64 (with padding).
///
/// Use this to allocate the output buffer before calling `base64_encode()`.
export fn base64_encode_len(input_len: usize) usize {
    return standard.Encoder.calcSize(input_len);
}

/// Encodes binary data to standard Base64 with `=` padding.
///
/// The output buffer must have at least `base64_encode_len(data_len)` bytes.
/// Returns the number of bytes written to the output buffer.
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

/// Returns the maximum decoded length for standard Base64.
///
/// The actual decoded length may be less due to padding characters.
export fn base64_decode_len(input_len: usize) usize {
    // Max decoded size is 3/4 of encoded size
    return (input_len / 4) * 3;
}

/// Decodes standard Base64 data to binary.
///
/// Returns the actual number of decoded bytes, or 0 on invalid input.
/// The output buffer must have at least `base64_decode_len(data_len)` bytes.
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

/// Returns the encoded length for Base64 without padding.
export fn base64_no_pad_encode_len(input_len: usize) usize {
    return standard_no_pad.Encoder.calcSize(input_len);
}

/// Encodes binary data to Base64 without padding characters.
///
/// Returns the number of bytes written to the output buffer.
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

/// Returns the decoded length for Base64 without padding.
export fn base64_no_pad_decode_len(input_len: usize) usize {
    const remainder = input_len % 4;
    const full_groups = input_len / 4;
    const extra_bytes: usize = switch (remainder) {
        0 => 0,
        2 => 1,
        3 => 2,
        else => 0,
    };
    return full_groups * 3 + extra_bytes;
}

/// Decodes Base64 data without padding.
///
/// Returns the actual number of decoded bytes, or 0 on invalid input.
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

/// Returns the encoded length for URL-safe Base64 (with padding).
export fn base64_url_encode_len(input_len: usize) usize {
    return url_safe.Encoder.calcSize(input_len);
}

/// Encodes binary data to URL-safe Base64 using `-_` alphabet with padding.
///
/// This variant is safe for use in URLs and filenames.
/// Returns the number of bytes written to the output buffer.
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

/// Returns the maximum decoded length for URL-safe Base64.
export fn base64_url_decode_len(input_len: usize) usize {
    return (input_len / 4) * 3;
}

/// Decodes URL-safe Base64 data to binary.
///
/// Returns the actual number of decoded bytes, or 0 on invalid input.
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

/// Returns the encoded length for URL-safe Base64 without padding.
export fn base64_url_no_pad_encode_len(input_len: usize) usize {
    return url_safe_no_pad.Encoder.calcSize(input_len);
}

/// Encodes binary data to URL-safe Base64 without padding.
///
/// This is the most compact URL-safe encoding variant.
/// Returns the number of bytes written to the output buffer.
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

/// Returns the decoded length for URL-safe Base64 without padding.
export fn base64_url_no_pad_decode_len(input_len: usize) usize {
    const remainder = input_len % 4;
    const full_groups = input_len / 4;
    const extra_bytes: usize = switch (remainder) {
        0 => 0,
        2 => 1,
        3 => 2,
        else => 0,
    };
    return full_groups * 3 + extra_bytes;
}

/// Decodes URL-safe Base64 data without padding.
///
/// Returns the actual number of decoded bytes, or 0 on invalid input.
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

/// Returns the hex-encoded length (always `input_len * 2`).
export fn hex_encode_len(input_len: usize) usize {
    return input_len * 2;
}

/// Encodes binary data to lowercase hexadecimal.
///
/// Each input byte becomes two hex characters (e.g., `0xff` -> `"ff"`).
/// Returns the number of bytes written (always `data_len * 2`).
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

/// Returns the hex-decoded length (always `input_len / 2`).
export fn hex_decode_len(input_len: usize) usize {
    return input_len / 2;
}

/// Decodes a hexadecimal string to binary data.
///
/// Accepts both uppercase and lowercase hex characters.
/// Returns the number of decoded bytes, or 0 on invalid input
/// (odd length or invalid hex characters).
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

/// Converts a single hex character to its 4-bit value.
fn hexCharToNibble(c: u8) ?u8 {
    return switch (c) {
        '0'...'9' => c - '0',
        'a'...'f' => c - 'a' + 10,
        'A'...'F' => c - 'A' + 10,
        else => null,
    };
}
