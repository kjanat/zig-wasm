//! Mathematical constants for the math WASM module.
//!
//! Provides common mathematical constants: pi, e, ln(2), ln(10)
//! for floating-point types (f32, f64).

const std = @import("std");
const math = std.math;

/// Returns the value of pi (f32).
/// pi = 3.14159265358979323846...
pub fn pi_f32() f32 {
    return math.pi;
}

/// Returns the value of pi (f64).
/// pi = 3.14159265358979323846...
pub fn pi_f64() f64 {
    return math.pi;
}

/// Returns Euler's number e (f32).
/// e = 2.71828182845904523536...
pub fn e_f32() f32 {
    return math.e;
}

/// Returns Euler's number e (f64).
/// e = 2.71828182845904523536...
pub fn e_f64() f64 {
    return math.e;
}

/// Returns the natural logarithm of 2 (f64).
/// ln(2) = 0.69314718055994530941...
pub fn ln2_f64() f64 {
    return math.ln2;
}

/// Returns the natural logarithm of 10 (f64).
/// ln(10) = 2.30258509299404568401...
pub fn ln10_f64() f64 {
    return math.ln10;
}
