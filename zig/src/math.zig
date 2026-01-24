//! Math WASM module - High-performance mathematical functions.
//!
//! This module exports mathematical functions for use via WebAssembly.
//! It wraps Zig's `std.math` module and provides functions organized into
//! the following categories:
//!
//! - **Arithmetic**: abs, min, max, clamp
//! - **Power/Roots**: sqrt, cbrt, pow, hypot
//! - **Exponential/Logarithmic**: exp, exp2, expm1, log, log2, log10, log1p
//! - **Trigonometric**: sin, cos, tan, asin, acos, atan, atan2, deg2rad, rad2deg
//! - **Hyperbolic**: sinh, cosh, tanh, asinh, acosh, atanh
//! - **Rounding**: floor, ceil, round, trunc
//! - **Classification**: isnan, isinf, isfinite, sign
//! - **Constants**: pi, e, ln2, ln10
//! - **Bit Manipulation**: clz, ctz, popcount, bswap, rotl, rotr
//! - **Integer Math**: gcd, lcm
//! - **Float Utilities**: modf, fmod, copysign, fma
//!
//! All functions are exported for WASM consumption with type suffixes
//! indicating the numeric type (e.g., `_f32`, `_f64`, `_i32`, `_u64`).

const allocator_mod = @import("allocator.zig");
const arithmetic = @import("math/arithmetic.zig");
const power = @import("math/power.zig");
const exp_log = @import("math/exp_log.zig");
const trig = @import("math/trig.zig");
const hyperbolic = @import("math/hyperbolic.zig");
const rounding = @import("math/rounding.zig");
const special = @import("math/special.zig");
const constants = @import("math/constants.zig");
const bits = @import("math/bits.zig");
const integer = @import("math/integer.zig");
const float = @import("math/float.zig");

// Allocator exports

/// Allocates `size` bytes from the WASM linear memory.
/// Returns a pointer to the allocated memory, or null on failure.
export fn alloc(size: usize) ?[*]u8 {
    return allocator_mod.alloc(size);
}

/// Frees memory previously allocated by `alloc`.
export fn free(ptr: [*]u8, size: usize) void {
    allocator_mod.free(ptr, size);
}

// Arithmetic exports

/// Absolute value (i32).
export fn abs_i32(x: i32) i32 {
    return arithmetic.abs_i32(x);
}

/// Absolute value (i64).
export fn abs_i64(x: i64) i64 {
    return arithmetic.abs_i64(x);
}

/// Absolute value (f32).
export fn abs_f32(x: f32) f32 {
    return arithmetic.abs_f32(x);
}

/// Absolute value (f64).
export fn abs_f64(x: f64) f64 {
    return arithmetic.abs_f64(x);
}

/// Minimum of two values (i32).
export fn min_i32(a: i32, b: i32) i32 {
    return arithmetic.min_i32(a, b);
}

/// Minimum of two values (i64).
export fn min_i64(a: i64, b: i64) i64 {
    return arithmetic.min_i64(a, b);
}

/// Minimum of two values (f32).
export fn min_f32(a: f32, b: f32) f32 {
    return arithmetic.min_f32(a, b);
}

/// Minimum of two values (f64).
export fn min_f64(a: f64, b: f64) f64 {
    return arithmetic.min_f64(a, b);
}

/// Minimum of two values (u32).
export fn min_u32(a: u32, b: u32) u32 {
    return arithmetic.min_u32(a, b);
}

/// Minimum of two values (u64).
export fn min_u64(a: u64, b: u64) u64 {
    return arithmetic.min_u64(a, b);
}

/// Maximum of two values (i32).
export fn max_i32(a: i32, b: i32) i32 {
    return arithmetic.max_i32(a, b);
}

/// Maximum of two values (i64).
export fn max_i64(a: i64, b: i64) i64 {
    return arithmetic.max_i64(a, b);
}

/// Maximum of two values (f32).
export fn max_f32(a: f32, b: f32) f32 {
    return arithmetic.max_f32(a, b);
}

/// Maximum of two values (f64).
export fn max_f64(a: f64, b: f64) f64 {
    return arithmetic.max_f64(a, b);
}

/// Maximum of two values (u32).
export fn max_u32(a: u32, b: u32) u32 {
    return arithmetic.max_u32(a, b);
}

/// Maximum of two values (u64).
export fn max_u64(a: u64, b: u64) u64 {
    return arithmetic.max_u64(a, b);
}

/// Clamp value to range [lo, hi] (i32).
export fn clamp_i32(val: i32, lo: i32, hi: i32) i32 {
    return arithmetic.clamp_i32(val, lo, hi);
}

/// Clamp value to range [lo, hi] (i64).
export fn clamp_i64(val: i64, lo: i64, hi: i64) i64 {
    return arithmetic.clamp_i64(val, lo, hi);
}

/// Clamp value to range [lo, hi] (f32).
export fn clamp_f32(val: f32, lo: f32, hi: f32) f32 {
    return arithmetic.clamp_f32(val, lo, hi);
}

/// Clamp value to range [lo, hi] (f64).
export fn clamp_f64(val: f64, lo: f64, hi: f64) f64 {
    return arithmetic.clamp_f64(val, lo, hi);
}

/// Clamp value to range [lo, hi] (u32).
export fn clamp_u32(val: u32, lo: u32, hi: u32) u32 {
    return arithmetic.clamp_u32(val, lo, hi);
}

/// Clamp value to range [lo, hi] (u64).
export fn clamp_u64(val: u64, lo: u64, hi: u64) u64 {
    return arithmetic.clamp_u64(val, lo, hi);
}

// Power and root exports

/// Square root (f32).
export fn sqrt_f32(x: f32) f32 {
    return power.sqrt_f32(x);
}

/// Square root (f64).
export fn sqrt_f64(x: f64) f64 {
    return power.sqrt_f64(x);
}

/// Cube root (f32).
export fn cbrt_f32(x: f32) f32 {
    return power.cbrt_f32(x);
}

/// Cube root (f64).
export fn cbrt_f64(x: f64) f64 {
    return power.cbrt_f64(x);
}

/// Power: base^exp (f32).
export fn pow_f32(base: f32, exp: f32) f32 {
    return power.pow_f32(base, exp);
}

/// Power: base^exp (f64).
export fn pow_f64(base: f64, exp: f64) f64 {
    return power.pow_f64(base, exp);
}

/// Hypotenuse: sqrt(x^2 + y^2) (f32).
export fn hypot_f32(x: f32, y: f32) f32 {
    return power.hypot_f32(x, y);
}

/// Hypotenuse: sqrt(x^2 + y^2) (f64).
export fn hypot_f64(x: f64, y: f64) f64 {
    return power.hypot_f64(x, y);
}

// Exponential and logarithm exports

/// Exponential e^x (f32).
export fn exp_f32(x: f32) f32 {
    return exp_log.exp_f32(x);
}

/// Exponential e^x (f64).
export fn exp_f64(x: f64) f64 {
    return exp_log.exp_f64(x);
}

/// Exponential 2^x (f32).
export fn exp2_f32(x: f32) f32 {
    return exp_log.exp2_f32(x);
}

/// Exponential 2^x (f64).
export fn exp2_f64(x: f64) f64 {
    return exp_log.exp2_f64(x);
}

/// Exponential e^x - 1 (f32).
export fn expm1_f32(x: f32) f32 {
    return exp_log.expm1_f32(x);
}

/// Exponential e^x - 1 (f64).
export fn expm1_f64(x: f64) f64 {
    return exp_log.expm1_f64(x);
}

/// Natural logarithm (f32).
export fn log_f32(x: f32) f32 {
    return exp_log.log_f32(x);
}

/// Natural logarithm (f64).
export fn log_f64(x: f64) f64 {
    return exp_log.log_f64(x);
}

/// Base-2 logarithm (f32).
export fn log2_f32(x: f32) f32 {
    return exp_log.log2_f32(x);
}

/// Base-2 logarithm (f64).
export fn log2_f64(x: f64) f64 {
    return exp_log.log2_f64(x);
}

/// Base-10 logarithm (f32).
export fn log10_f32(x: f32) f32 {
    return exp_log.log10_f32(x);
}

/// Base-10 logarithm (f64).
export fn log10_f64(x: f64) f64 {
    return exp_log.log10_f64(x);
}

/// Logarithm ln(1 + x) (f32).
export fn log1p_f32(x: f32) f32 {
    return exp_log.log1p_f32(x);
}

/// Logarithm ln(1 + x) (f64).
export fn log1p_f64(x: f64) f64 {
    return exp_log.log1p_f64(x);
}

// Trigonometric exports

/// Sine (f32).
export fn sin_f32(x: f32) f32 {
    return trig.sin_f32(x);
}

/// Sine (f64).
export fn sin_f64(x: f64) f64 {
    return trig.sin_f64(x);
}

/// Cosine (f32).
export fn cos_f32(x: f32) f32 {
    return trig.cos_f32(x);
}

/// Cosine (f64).
export fn cos_f64(x: f64) f64 {
    return trig.cos_f64(x);
}

/// Tangent (f32).
export fn tan_f32(x: f32) f32 {
    return trig.tan_f32(x);
}

/// Tangent (f64).
export fn tan_f64(x: f64) f64 {
    return trig.tan_f64(x);
}

/// Arc sine (f32).
export fn asin_f32(x: f32) f32 {
    return trig.asin_f32(x);
}

/// Arc sine (f64).
export fn asin_f64(x: f64) f64 {
    return trig.asin_f64(x);
}

/// Arc cosine (f32).
export fn acos_f32(x: f32) f32 {
    return trig.acos_f32(x);
}

/// Arc cosine (f64).
export fn acos_f64(x: f64) f64 {
    return trig.acos_f64(x);
}

/// Arc tangent (f32).
export fn atan_f32(x: f32) f32 {
    return trig.atan_f32(x);
}

/// Arc tangent (f64).
export fn atan_f64(x: f64) f64 {
    return trig.atan_f64(x);
}

/// Arc tangent of y/x (f32).
export fn atan2_f32(y: f32, x: f32) f32 {
    return trig.atan2_f32(y, x);
}

/// Arc tangent of y/x (f64).
export fn atan2_f64(y: f64, x: f64) f64 {
    return trig.atan2_f64(y, x);
}

/// Convert degrees to radians (f32).
export fn deg2rad_f32(deg: f32) f32 {
    return trig.deg2rad_f32(deg);
}

/// Convert degrees to radians (f64).
export fn deg2rad_f64(deg: f64) f64 {
    return trig.deg2rad_f64(deg);
}

/// Convert radians to degrees (f32).
export fn rad2deg_f32(rad: f32) f32 {
    return trig.rad2deg_f32(rad);
}

/// Convert radians to degrees (f64).
export fn rad2deg_f64(rad: f64) f64 {
    return trig.rad2deg_f64(rad);
}

// Hyperbolic exports

/// Hyperbolic sine (f32).
export fn sinh_f32(x: f32) f32 {
    return hyperbolic.sinh_f32(x);
}

/// Hyperbolic sine (f64).
export fn sinh_f64(x: f64) f64 {
    return hyperbolic.sinh_f64(x);
}

/// Hyperbolic cosine (f32).
export fn cosh_f32(x: f32) f32 {
    return hyperbolic.cosh_f32(x);
}

/// Hyperbolic cosine (f64).
export fn cosh_f64(x: f64) f64 {
    return hyperbolic.cosh_f64(x);
}

/// Hyperbolic tangent (f32).
export fn tanh_f32(x: f32) f32 {
    return hyperbolic.tanh_f32(x);
}

/// Hyperbolic tangent (f64).
export fn tanh_f64(x: f64) f64 {
    return hyperbolic.tanh_f64(x);
}

/// Inverse hyperbolic sine (f32).
export fn asinh_f32(x: f32) f32 {
    return hyperbolic.asinh_f32(x);
}

/// Inverse hyperbolic sine (f64).
export fn asinh_f64(x: f64) f64 {
    return hyperbolic.asinh_f64(x);
}

/// Inverse hyperbolic cosine (f32).
export fn acosh_f32(x: f32) f32 {
    return hyperbolic.acosh_f32(x);
}

/// Inverse hyperbolic cosine (f64).
export fn acosh_f64(x: f64) f64 {
    return hyperbolic.acosh_f64(x);
}

/// Inverse hyperbolic tangent (f32).
export fn atanh_f32(x: f32) f32 {
    return hyperbolic.atanh_f32(x);
}

/// Inverse hyperbolic tangent (f64).
export fn atanh_f64(x: f64) f64 {
    return hyperbolic.atanh_f64(x);
}

// Rounding exports

/// Round down to nearest integer (f32).
export fn floor_f32(x: f32) f32 {
    return rounding.floor_f32(x);
}

/// Round down to nearest integer (f64).
export fn floor_f64(x: f64) f64 {
    return rounding.floor_f64(x);
}

/// Round up to nearest integer (f32).
export fn ceil_f32(x: f32) f32 {
    return rounding.ceil_f32(x);
}

/// Round up to nearest integer (f64).
export fn ceil_f64(x: f64) f64 {
    return rounding.ceil_f64(x);
}

/// Round to nearest integer (f32).
export fn round_f32(x: f32) f32 {
    return rounding.round_f32(x);
}

/// Round to nearest integer (f64).
export fn round_f64(x: f64) f64 {
    return rounding.round_f64(x);
}

/// Truncate toward zero (f32).
export fn trunc_f32(x: f32) f32 {
    return rounding.trunc_f32(x);
}

/// Truncate toward zero (f64).
export fn trunc_f64(x: f64) f64 {
    return rounding.trunc_f64(x);
}

// Classification exports

/// Check if NaN (f32).
export fn isnan_f32(x: f32) bool {
    return special.isnan_f32(x);
}

/// Check if NaN (f64).
export fn isnan_f64(x: f64) bool {
    return special.isnan_f64(x);
}

/// Check if infinite (f32).
export fn isinf_f32(x: f32) bool {
    return special.isinf_f32(x);
}

/// Check if infinite (f64).
export fn isinf_f64(x: f64) bool {
    return special.isinf_f64(x);
}

/// Check if finite (f32).
export fn isfinite_f32(x: f32) bool {
    return special.isfinite_f32(x);
}

/// Check if finite (f64).
export fn isfinite_f64(x: f64) bool {
    return special.isfinite_f64(x);
}

/// Get sign (-1, 0, or 1) (f32).
export fn sign_f32(x: f32) f32 {
    return special.sign_f32(x);
}

/// Get sign (-1, 0, or 1) (f64).
export fn sign_f64(x: f64) f64 {
    return special.sign_f64(x);
}

// Constant exports

/// Pi constant (f32).
export fn pi_f32() f32 {
    return constants.pi_f32();
}

/// Pi constant (f64).
export fn pi_f64() f64 {
    return constants.pi_f64();
}

/// Euler's number e (f32).
export fn e_f32() f32 {
    return constants.e_f32();
}

/// Euler's number e (f64).
export fn e_f64() f64 {
    return constants.e_f64();
}

/// Natural log of 2 (f64).
export fn ln2_f64() f64 {
    return constants.ln2_f64();
}

/// Natural log of 10 (f64).
export fn ln10_f64() f64 {
    return constants.ln10_f64();
}

// Bit manipulation exports

/// Count leading zeros (u32).
export fn clz_u32(x: u32) u32 {
    return bits.clz_u32(x);
}

/// Count leading zeros (u64).
export fn clz_u64(x: u64) u64 {
    return bits.clz_u64(x);
}

/// Count trailing zeros (u32).
export fn ctz_u32(x: u32) u32 {
    return bits.ctz_u32(x);
}

/// Count trailing zeros (u64).
export fn ctz_u64(x: u64) u64 {
    return bits.ctz_u64(x);
}

/// Population count (u32).
export fn popcount_u32(x: u32) u32 {
    return bits.popcount_u32(x);
}

/// Population count (u64).
export fn popcount_u64(x: u64) u64 {
    return bits.popcount_u64(x);
}

/// Byte swap (u16).
export fn bswap_u16(x: u16) u16 {
    return bits.bswap_u16(x);
}

/// Byte swap (u32).
export fn bswap_u32(x: u32) u32 {
    return bits.bswap_u32(x);
}

/// Byte swap (u64).
export fn bswap_u64(x: u64) u64 {
    return bits.bswap_u64(x);
}

/// Rotate left (u32).
export fn rotl_u32(x: u32, r: u32) u32 {
    return bits.rotl_u32(x, r);
}

/// Rotate left (u64).
export fn rotl_u64(x: u64, r: u32) u64 {
    return bits.rotl_u64(x, r);
}

/// Rotate right (u32).
export fn rotr_u32(x: u32, r: u32) u32 {
    return bits.rotr_u32(x, r);
}

/// Rotate right (u64).
export fn rotr_u64(x: u64, r: u32) u64 {
    return bits.rotr_u64(x, r);
}

// Integer math exports

/// Greatest common divisor (u32).
export fn gcd_u32(a: u32, b: u32) u32 {
    return integer.gcd_u32(a, b);
}

/// Greatest common divisor (u64).
export fn gcd_u64(a: u64, b: u64) u64 {
    return integer.gcd_u64(a, b);
}

/// Least common multiple (u32).
export fn lcm_u32(a: u32, b: u32) u32 {
    return integer.lcm_u32(a, b);
}

/// Least common multiple (u64).
export fn lcm_u64(a: u64, b: u64) u64 {
    return integer.lcm_u64(a, b);
}

// Float utility exports

/// Split into integer and fractional parts (f32).
export fn modf_f32(x: f32, int_part: *f32) f32 {
    return float.modf_f32(x, int_part);
}

/// Split into integer and fractional parts (f64).
export fn modf_f64(x: f64, int_part: *f64) f64 {
    return float.modf_f64(x, int_part);
}

/// Floating-point remainder (f32).
export fn fmod_f32(x: f32, y: f32) f32 {
    return float.fmod_f32(x, y);
}

/// Floating-point remainder (f64).
export fn fmod_f64(x: f64, y: f64) f64 {
    return float.fmod_f64(x, y);
}

/// Copy sign from sgn to mag (f32).
export fn copysign_f32(mag: f32, sgn: f32) f32 {
    return float.copysign_f32(mag, sgn);
}

/// Copy sign from sgn to mag (f64).
export fn copysign_f64(mag: f64, sgn: f64) f64 {
    return float.copysign_f64(mag, sgn);
}

/// Fused multiply-add: x*y + z (f32).
export fn fma_f32(x: f32, y: f32, z: f32) f32 {
    return float.fma_f32(x, y, z);
}

/// Fused multiply-add: x*y + z (f64).
export fn fma_f64(x: f64, y: f64, z: f64) f64 {
    return float.fma_f64(x, y, z);
}
