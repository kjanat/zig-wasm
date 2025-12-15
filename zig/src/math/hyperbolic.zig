//! Hyperbolic functions for the math WASM module.
//!
//! Provides sinh, cosh, tanh, asinh, acosh, and atanh functions
//! for floating-point types (f32, f64).

const std = @import("std");
const math = std.math;

// Hyperbolic

/// Computes the hyperbolic sine of `x` (f32).
/// sinh(x) = (e^x - e^-x) / 2
pub fn sinh_f32(x: f32) f32 {
    return math.sinh(x);
}

/// Computes the hyperbolic sine of `x` (f64).
/// sinh(x) = (e^x - e^-x) / 2
pub fn sinh_f64(x: f64) f64 {
    return math.sinh(x);
}

/// Computes the hyperbolic cosine of `x` (f32).
/// cosh(x) = (e^x + e^-x) / 2. Always >= 1.
pub fn cosh_f32(x: f32) f32 {
    return math.cosh(x);
}

/// Computes the hyperbolic cosine of `x` (f64).
/// cosh(x) = (e^x + e^-x) / 2. Always >= 1.
pub fn cosh_f64(x: f64) f64 {
    return math.cosh(x);
}

/// Computes the hyperbolic tangent of `x` (f32).
/// Returns a value in the range (-1, 1).
pub fn tanh_f32(x: f32) f32 {
    return math.tanh(x);
}

/// Computes the hyperbolic tangent of `x` (f64).
/// Returns a value in the range (-1, 1).
pub fn tanh_f64(x: f64) f64 {
    return math.tanh(x);
}

// Inverse hyperbolic

/// Computes the inverse hyperbolic sine of `x` (f32).
/// Defined for all real numbers.
pub fn asinh_f32(x: f32) f32 {
    return math.asinh(x);
}

/// Computes the inverse hyperbolic sine of `x` (f64).
/// Defined for all real numbers.
pub fn asinh_f64(x: f64) f64 {
    return math.asinh(x);
}

/// Computes the inverse hyperbolic cosine of `x` (f32).
/// Input must be >= 1. Returns NaN for x < 1.
pub fn acosh_f32(x: f32) f32 {
    return math.acosh(x);
}

/// Computes the inverse hyperbolic cosine of `x` (f64).
/// Input must be >= 1. Returns NaN for x < 1.
pub fn acosh_f64(x: f64) f64 {
    return math.acosh(x);
}

/// Computes the inverse hyperbolic tangent of `x` (f32).
/// Input must be in (-1, 1). Returns NaN for |x| >= 1.
pub fn atanh_f32(x: f32) f32 {
    return math.atanh(x);
}

/// Computes the inverse hyperbolic tangent of `x` (f64).
/// Input must be in (-1, 1). Returns NaN for |x| >= 1.
pub fn atanh_f64(x: f64) f64 {
    return math.atanh(x);
}
