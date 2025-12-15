//! Rounding functions for the math WASM module.
//!
//! Provides floor, ceil, round, and trunc functions
//! for floating-point types (f32, f64).

/// Rounds `x` down to the nearest integer (toward negative infinity) (f32).
/// floor(3.7) = 3, floor(-3.7) = -4
pub fn floor_f32(x: f32) f32 {
    return @floor(x);
}

/// Rounds `x` down to the nearest integer (toward negative infinity) (f64).
/// floor(3.7) = 3, floor(-3.7) = -4
pub fn floor_f64(x: f64) f64 {
    return @floor(x);
}

/// Rounds `x` up to the nearest integer (toward positive infinity) (f32).
/// ceil(3.2) = 4, ceil(-3.2) = -3
pub fn ceil_f32(x: f32) f32 {
    return @ceil(x);
}

/// Rounds `x` up to the nearest integer (toward positive infinity) (f64).
/// ceil(3.2) = 4, ceil(-3.2) = -3
pub fn ceil_f64(x: f64) f64 {
    return @ceil(x);
}

/// Rounds `x` to the nearest integer (ties away from zero) (f32).
/// round(3.5) = 4, round(-3.5) = -4
pub fn round_f32(x: f32) f32 {
    return @round(x);
}

/// Rounds `x` to the nearest integer (ties away from zero) (f64).
/// round(3.5) = 4, round(-3.5) = -4
pub fn round_f64(x: f64) f64 {
    return @round(x);
}

/// Truncates `x` toward zero (removes the fractional part) (f32).
/// trunc(3.7) = 3, trunc(-3.7) = -3
pub fn trunc_f32(x: f32) f32 {
    return @trunc(x);
}

/// Truncates `x` toward zero (removes the fractional part) (f64).
/// trunc(3.7) = 3, trunc(-3.7) = -3
pub fn trunc_f64(x: f64) f64 {
    return @trunc(x);
}
