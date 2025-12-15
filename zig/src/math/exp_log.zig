//! Exponential and logarithmic functions for the math WASM module.
//!
//! Provides exp, exp2, expm1, log, log2, log10, and log1p functions
//! for floating-point types (f32, f64).

const std = @import("std");
const math = std.math;

// Exponential

/// Computes e^x (f32).
/// Returns positive infinity for large positive `x`.
pub fn exp_f32(x: f32) f32 {
    return @exp(x);
}

/// Computes e^x (f64).
/// Returns positive infinity for large positive `x`.
pub fn exp_f64(x: f64) f64 {
    return @exp(x);
}

/// Computes 2^x (f32).
pub fn exp2_f32(x: f32) f32 {
    return @exp2(x);
}

/// Computes 2^x (f64).
pub fn exp2_f64(x: f64) f64 {
    return @exp2(x);
}

/// Computes e^x - 1 with better precision for small `x` (f32).
/// For small values of `x`, this is more accurate than computing exp(x) - 1.
pub fn expm1_f32(x: f32) f32 {
    return math.expm1(x);
}

/// Computes e^x - 1 with better precision for small `x` (f64).
/// For small values of `x`, this is more accurate than computing exp(x) - 1.
pub fn expm1_f64(x: f64) f64 {
    return math.expm1(x);
}

// Logarithm

/// Computes the natural logarithm (base e) of `x` (f32).
/// Returns NaN for negative `x`, negative infinity for x = 0.
pub fn log_f32(x: f32) f32 {
    return @log(x);
}

/// Computes the natural logarithm (base e) of `x` (f64).
/// Returns NaN for negative `x`, negative infinity for x = 0.
pub fn log_f64(x: f64) f64 {
    return @log(x);
}

/// Computes the base-2 logarithm of `x` (f32).
pub fn log2_f32(x: f32) f32 {
    return @log2(x);
}

/// Computes the base-2 logarithm of `x` (f64).
pub fn log2_f64(x: f64) f64 {
    return @log2(x);
}

/// Computes the base-10 logarithm of `x` (f32).
pub fn log10_f32(x: f32) f32 {
    return @log10(x);
}

/// Computes the base-10 logarithm of `x` (f64).
pub fn log10_f64(x: f64) f64 {
    return @log10(x);
}

/// Computes ln(1 + x) with better precision for small `x` (f32).
/// For small values of `x`, this is more accurate than computing log(1 + x).
pub fn log1p_f32(x: f32) f32 {
    return math.log1p(x);
}

/// Computes ln(1 + x) with better precision for small `x` (f64).
/// For small values of `x`, this is more accurate than computing log(1 + x).
pub fn log1p_f64(x: f64) f64 {
    return math.log1p(x);
}
