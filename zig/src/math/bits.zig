//! Bit manipulation functions for the math WASM module.
//!
//! Provides count leading/trailing zeros, population count, byte swap,
//! and bit rotation functions for unsigned integer types (u16, u32, u64).

const std = @import("std");
const math = std.math;

// Count leading/trailing zeros

/// Counts the number of leading zero bits in `x` (u32).
/// Returns 32 if `x` is 0.
pub fn clz_u32(x: u32) u32 {
    return @clz(x);
}

/// Counts the number of leading zero bits in `x` (u64).
/// Returns 64 if `x` is 0.
pub fn clz_u64(x: u64) u64 {
    return @clz(x);
}

/// Counts the number of trailing zero bits in `x` (u32).
/// Returns 32 if `x` is 0.
pub fn ctz_u32(x: u32) u32 {
    return @ctz(x);
}

/// Counts the number of trailing zero bits in `x` (u64).
/// Returns 64 if `x` is 0.
pub fn ctz_u64(x: u64) u64 {
    return @ctz(x);
}

// Population count

/// Counts the number of set bits (ones) in `x` (u32).
/// Also known as Hamming weight or population count.
pub fn popcount_u32(x: u32) u32 {
    return @popCount(x);
}

/// Counts the number of set bits (ones) in `x` (u64).
/// Also known as Hamming weight or population count.
pub fn popcount_u64(x: u64) u64 {
    return @popCount(x);
}

// Byte swap

/// Reverses the byte order of `x` (u16).
/// Converts between little-endian and big-endian representations.
pub fn bswap_u16(x: u16) u16 {
    return @byteSwap(x);
}

/// Reverses the byte order of `x` (u32).
/// Converts between little-endian and big-endian representations.
pub fn bswap_u32(x: u32) u32 {
    return @byteSwap(x);
}

/// Reverses the byte order of `x` (u64).
/// Converts between little-endian and big-endian representations.
pub fn bswap_u64(x: u64) u64 {
    return @byteSwap(x);
}

// Rotate

/// Rotates `x` left by `r` bit positions (u32).
/// Bits shifted out on the left re-enter on the right.
pub fn rotl_u32(x: u32, r: u32) u32 {
    return math.rotl(u32, x, @as(u5, @truncate(r)));
}

/// Rotates `x` left by `r` bit positions (u64).
/// Bits shifted out on the left re-enter on the right.
pub fn rotl_u64(x: u64, r: u32) u64 {
    return math.rotl(u64, x, @as(u6, @truncate(r)));
}

/// Rotates `x` right by `r` bit positions (u32).
/// Bits shifted out on the right re-enter on the left.
pub fn rotr_u32(x: u32, r: u32) u32 {
    return math.rotr(u32, x, @as(u5, @truncate(r)));
}

/// Rotates `x` right by `r` bit positions (u64).
/// Bits shifted out on the right re-enter on the left.
pub fn rotr_u64(x: u64, r: u32) u64 {
    return math.rotr(u64, x, @as(u6, @truncate(r)));
}
