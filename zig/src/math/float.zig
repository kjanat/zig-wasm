//! Floating-point utility functions for the math WASM module.
//!
//! Provides modf (split into integer/fractional parts), fmod (floating-point
//! remainder), copysign, and fma (fused multiply-add) for floating-point
//! types (f32, f64).

const std = @import("std");
const math = std.math;

// Modf (fractional and integer parts)

/// Splits `x` into integer and fractional parts (f32).
/// Stores the integer part in `int_part` and returns the fractional part.
/// Both parts have the same sign as `x`.
pub fn modf_f32(x: f32, int_part: *f32) f32 {
    const result = math.modf(x);
    int_part.* = result.ipart;
    return result.fpart;
}

/// Splits `x` into integer and fractional parts (f64).
/// Stores the integer part in `int_part` and returns the fractional part.
/// Both parts have the same sign as `x`.
pub fn modf_f64(x: f64, int_part: *f64) f64 {
    const result = math.modf(x);
    int_part.* = result.ipart;
    return result.fpart;
}

// Fmod (floating point remainder)

/// Computes the floating-point remainder of x/y (f32).
/// The result has the same sign as `x`.
pub fn fmod_f32(x: f32, y: f32) f32 {
    return @mod(x, y);
}

/// Computes the floating-point remainder of x/y (f64).
/// The result has the same sign as `x`.
pub fn fmod_f64(x: f64, y: f64) f64 {
    return @mod(x, y);
}

// Copysign

/// Returns a value with the magnitude of `mag` and the sign of `sgn` (f32).
pub fn copysign_f32(mag: f32, sgn: f32) f32 {
    return math.copysign(mag, sgn);
}

/// Returns a value with the magnitude of `mag` and the sign of `sgn` (f64).
pub fn copysign_f64(mag: f64, sgn: f64) f64 {
    return math.copysign(mag, sgn);
}

// Fused multiply-add

/// Computes (x * y) + z with a single rounding operation (f32).
/// More accurate than separate multiply and add for numerical algorithms.
pub fn fma_f32(x: f32, y: f32, z: f32) f32 {
    return @mulAdd(f32, x, y, z);
}

/// Computes (x * y) + z with a single rounding operation (f64).
/// More accurate than separate multiply and add for numerical algorithms.
pub fn fma_f64(x: f64, y: f64, z: f64) f64 {
    return @mulAdd(f64, x, y, z);
}
