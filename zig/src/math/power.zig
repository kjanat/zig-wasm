//! Power and root operations for the math WASM module.
//!
//! Provides square root, cube root, power, and hypotenuse functions
//! for floating-point types (f32, f64).

const std = @import("std");
const math = std.math;

// Square root

/// Computes the square root of `x` (f32).
/// Returns NaN if `x` is negative. Returns 0 for x = 0.
pub fn sqrt_f32(x: f32) f32 {
    return @sqrt(x);
}

/// Computes the square root of `x` (f64).
/// Returns NaN if `x` is negative. Returns 0 for x = 0.
pub fn sqrt_f64(x: f64) f64 {
    return @sqrt(x);
}

// Cube root

/// Computes the cube root of `x` (f32).
/// Unlike square root, cube root is defined for negative values.
pub fn cbrt_f32(x: f32) f32 {
    return math.cbrt(x);
}

/// Computes the cube root of `x` (f64).
/// Unlike square root, cube root is defined for negative values.
pub fn cbrt_f64(x: f64) f64 {
    return math.cbrt(x);
}

// Power

/// Computes `base` raised to the power `exp` (f32).
/// Special cases follow IEEE 754 semantics.
pub fn pow_f32(base: f32, exp: f32) f32 {
    return math.pow(f32, base, exp);
}

/// Computes `base` raised to the power `exp` (f64).
/// Special cases follow IEEE 754 semantics.
pub fn pow_f64(base: f64, exp: f64) f64 {
    return math.pow(f64, base, exp);
}

// Hypotenuse

/// Computes sqrt(x^2 + y^2) without overflow (f32).
/// This is the Euclidean distance from the origin to the point (x, y).
pub fn hypot_f32(x: f32, y: f32) f32 {
    return math.hypot(x, y);
}

/// Computes sqrt(x^2 + y^2) without overflow (f64).
/// This is the Euclidean distance from the origin to the point (x, y).
pub fn hypot_f64(x: f64, y: f64) f64 {
    return math.hypot(x, y);
}
