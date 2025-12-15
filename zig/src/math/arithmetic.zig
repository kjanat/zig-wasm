//! Basic arithmetic operations for the math WASM module.
//!
//! Provides absolute value, minimum, maximum, and clamping functions
//! for various numeric types (i32, i64, u32, u64, f32, f64).

const std = @import("std");

// Absolute value

/// Returns the absolute value of `x` as i32.
/// For the minimum value of i32 (-2147483648), behavior is undefined.
pub fn abs_i32(x: i32) i32 {
    return @intCast(@abs(x));
}

/// Returns the absolute value of `x` as i64.
/// For the minimum value of i64, behavior is undefined.
pub fn abs_i64(x: i64) i64 {
    return @intCast(@abs(x));
}

/// Returns the absolute value of `x` (f32).
pub fn abs_f32(x: f32) f32 {
    return @abs(x);
}

/// Returns the absolute value of `x` (f64).
pub fn abs_f64(x: f64) f64 {
    return @abs(x);
}

// Minimum

/// Returns the smaller of `a` and `b` (i32).
pub fn min_i32(a: i32, b: i32) i32 {
    return @min(a, b);
}

/// Returns the smaller of `a` and `b` (i64).
pub fn min_i64(a: i64, b: i64) i64 {
    return @min(a, b);
}

/// Returns the smaller of `a` and `b` (f32).
/// If either value is NaN, returns NaN.
pub fn min_f32(a: f32, b: f32) f32 {
    return @min(a, b);
}

/// Returns the smaller of `a` and `b` (f64).
/// If either value is NaN, returns NaN.
pub fn min_f64(a: f64, b: f64) f64 {
    return @min(a, b);
}

/// Returns the smaller of `a` and `b` (u32).
pub fn min_u32(a: u32, b: u32) u32 {
    return @min(a, b);
}

/// Returns the smaller of `a` and `b` (u64).
pub fn min_u64(a: u64, b: u64) u64 {
    return @min(a, b);
}

// Maximum

/// Returns the larger of `a` and `b` (i32).
pub fn max_i32(a: i32, b: i32) i32 {
    return @max(a, b);
}

/// Returns the larger of `a` and `b` (i64).
pub fn max_i64(a: i64, b: i64) i64 {
    return @max(a, b);
}

/// Returns the larger of `a` and `b` (f32).
/// If either value is NaN, returns NaN.
pub fn max_f32(a: f32, b: f32) f32 {
    return @max(a, b);
}

/// Returns the larger of `a` and `b` (f64).
/// If either value is NaN, returns NaN.
pub fn max_f64(a: f64, b: f64) f64 {
    return @max(a, b);
}

/// Returns the larger of `a` and `b` (u32).
pub fn max_u32(a: u32, b: u32) u32 {
    return @max(a, b);
}

/// Returns the larger of `a` and `b` (u64).
pub fn max_u64(a: u64, b: u64) u64 {
    return @max(a, b);
}

// Clamp

/// Clamps `val` to the range [lo, hi] (i32).
/// Returns `lo` if `val < lo`, `hi` if `val > hi`, otherwise `val`.
pub fn clamp_i32(val: i32, lo: i32, hi: i32) i32 {
    return std.math.clamp(val, lo, hi);
}

/// Clamps `val` to the range [lo, hi] (i64).
/// Returns `lo` if `val < lo`, `hi` if `val > hi`, otherwise `val`.
pub fn clamp_i64(val: i64, lo: i64, hi: i64) i64 {
    return std.math.clamp(val, lo, hi);
}

/// Clamps `val` to the range [lo, hi] (f32).
/// Returns `lo` if `val < lo`, `hi` if `val > hi`, otherwise `val`.
pub fn clamp_f32(val: f32, lo: f32, hi: f32) f32 {
    return std.math.clamp(val, lo, hi);
}

/// Clamps `val` to the range [lo, hi] (f64).
/// Returns `lo` if `val < lo`, `hi` if `val > hi`, otherwise `val`.
pub fn clamp_f64(val: f64, lo: f64, hi: f64) f64 {
    return std.math.clamp(val, lo, hi);
}

/// Clamps `val` to the range [lo, hi] (u32).
/// Returns `lo` if `val < lo`, `hi` if `val > hi`, otherwise `val`.
pub fn clamp_u32(val: u32, lo: u32, hi: u32) u32 {
    return std.math.clamp(val, lo, hi);
}

/// Clamps `val` to the range [lo, hi] (u64).
/// Returns `lo` if `val < lo`, `hi` if `val > hi`, otherwise `val`.
pub fn clamp_u64(val: u64, lo: u64, hi: u64) u64 {
    return std.math.clamp(val, lo, hi);
}
