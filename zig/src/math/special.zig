//! Special value classification functions for the math WASM module.
//!
//! Provides functions to check for NaN, infinity, finite values,
//! and to extract the sign of floating-point numbers (f32, f64).

const std = @import("std");
const math = std.math;

// NaN/Inf checks

/// Returns true if `x` is NaN (Not a Number) (f32).
pub fn isnan_f32(x: f32) bool {
    return math.isNan(x);
}

/// Returns true if `x` is NaN (Not a Number) (f64).
pub fn isnan_f64(x: f64) bool {
    return math.isNan(x);
}

/// Returns true if `x` is positive or negative infinity (f32).
pub fn isinf_f32(x: f32) bool {
    return math.isInf(x);
}

/// Returns true if `x` is positive or negative infinity (f64).
pub fn isinf_f64(x: f64) bool {
    return math.isInf(x);
}

/// Returns true if `x` is a finite number (not NaN or infinity) (f32).
pub fn isfinite_f32(x: f32) bool {
    return math.isFinite(x);
}

/// Returns true if `x` is a finite number (not NaN or infinity) (f64).
pub fn isfinite_f64(x: f64) bool {
    return math.isFinite(x);
}

// Sign

/// Returns the sign of `x` (f32).
/// Returns -1.0 for negative, 0.0 for zero, 1.0 for positive.
/// Returns NaN if `x` is NaN.
pub fn sign_f32(x: f32) f32 {
    return math.sign(x);
}

/// Returns the sign of `x` (f64).
/// Returns -1.0 for negative, 0.0 for zero, 1.0 for positive.
/// Returns NaN if `x` is NaN.
pub fn sign_f64(x: f64) f64 {
    return math.sign(x);
}
