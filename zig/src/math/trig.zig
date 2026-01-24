//! Trigonometric functions for the math WASM module.
//!
//! Provides sin, cos, tan, asin, acos, atan, atan2, and degree/radian
//! conversion functions for floating-point types (f32, f64).
//!
//! All angles are in radians unless otherwise noted.

const std = @import("std");
const math = std.math;

// Basic trigonometric

/// Computes the sine of `x` (radians) (f32).
/// Returns a value in the range [-1, 1].
pub fn sin_f32(x: f32) f32 {
    return @sin(x);
}

/// Computes the sine of `x` (radians) (f64).
/// Returns a value in the range [-1, 1].
pub fn sin_f64(x: f64) f64 {
    return @sin(x);
}

/// Computes the cosine of `x` (radians) (f32).
/// Returns a value in the range [-1, 1].
pub fn cos_f32(x: f32) f32 {
    return @cos(x);
}

/// Computes the cosine of `x` (radians) (f64).
/// Returns a value in the range [-1, 1].
pub fn cos_f64(x: f64) f64 {
    return @cos(x);
}

/// Computes the tangent of `x` (radians) (f32).
pub fn tan_f32(x: f32) f32 {
    return @tan(x);
}

/// Computes the tangent of `x` (radians) (f64).
pub fn tan_f64(x: f64) f64 {
    return @tan(x);
}

// Inverse trigonometric

/// Computes the arc sine (inverse sine) of `x` (f32).
/// Input must be in [-1, 1]. Returns a value in [-pi/2, pi/2].
pub fn asin_f32(x: f32) f32 {
    return math.asin(x);
}

/// Computes the arc sine (inverse sine) of `x` (f64).
/// Input must be in [-1, 1]. Returns a value in [-pi/2, pi/2].
pub fn asin_f64(x: f64) f64 {
    return math.asin(x);
}

/// Computes the arc cosine (inverse cosine) of `x` (f32).
/// Input must be in [-1, 1]. Returns a value in [0, pi].
pub fn acos_f32(x: f32) f32 {
    return math.acos(x);
}

/// Computes the arc cosine (inverse cosine) of `x` (f64).
/// Input must be in [-1, 1]. Returns a value in [0, pi].
pub fn acos_f64(x: f64) f64 {
    return math.acos(x);
}

/// Computes the arc tangent (inverse tangent) of `x` (f32).
/// Returns a value in [-pi/2, pi/2].
pub fn atan_f32(x: f32) f32 {
    return math.atan(x);
}

/// Computes the arc tangent (inverse tangent) of `x` (f64).
/// Returns a value in [-pi/2, pi/2].
pub fn atan_f64(x: f64) f64 {
    return math.atan(x);
}

/// Computes the arc tangent of y/x, using the signs to determine quadrant (f32).
/// Returns a value in [-pi, pi].
pub fn atan2_f32(y: f32, x: f32) f32 {
    return math.atan2(y, x);
}

/// Computes the arc tangent of y/x, using the signs to determine quadrant (f64).
/// Returns a value in [-pi, pi].
pub fn atan2_f64(y: f64, x: f64) f64 {
    return math.atan2(y, x);
}

// Degree/radian conversion

/// Converts degrees to radians (f32).
/// Formula: radians = degrees * (pi / 180)
pub fn deg2rad_f32(deg: f32) f32 {
    return deg * (math.pi / 180.0);
}

/// Converts degrees to radians (f64).
/// Formula: radians = degrees * (pi / 180)
pub fn deg2rad_f64(deg: f64) f64 {
    return deg * (math.pi / 180.0);
}

/// Converts radians to degrees (f32).
/// Formula: degrees = radians * (180 / pi)
pub fn rad2deg_f32(rad: f32) f32 {
    return rad * (180.0 / math.pi);
}

/// Converts radians to degrees (f64).
/// Formula: degrees = radians * (180 / pi)
pub fn rad2deg_f64(rad: f64) f64 {
    return rad * (180.0 / math.pi);
}
