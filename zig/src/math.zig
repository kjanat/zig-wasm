///! Mathematical functions for WASM export
///! Wraps Zig's std.math module
const std = @import("std");
const math = std.math;
const allocator_mod = @import("allocator.zig");

// Re-export allocator functions
export fn alloc(size: usize) ?[*]u8 {
    return allocator_mod.alloc(size);
}
export fn free(ptr: [*]u8, size: usize) void {
    allocator_mod.free(ptr, size);
}

// ============================================================================
// Basic arithmetic
// ============================================================================

/// Absolute value (i32)
export fn abs_i32(x: i32) i32 {
    return @intCast(@abs(x));
}

/// Absolute value (i64)
export fn abs_i64(x: i64) i64 {
    return @intCast(@abs(x));
}

/// Absolute value (f32)
export fn abs_f32(x: f32) f32 {
    return @abs(x);
}

/// Absolute value (f64)
export fn abs_f64(x: f64) f64 {
    return @abs(x);
}

/// Minimum of two values
export fn min_i32(a: i32, b: i32) i32 {
    return @min(a, b);
}

export fn min_i64(a: i64, b: i64) i64 {
    return @min(a, b);
}

export fn min_f32(a: f32, b: f32) f32 {
    return @min(a, b);
}

export fn min_f64(a: f64, b: f64) f64 {
    return @min(a, b);
}

/// Maximum of two values
export fn max_i32(a: i32, b: i32) i32 {
    return @max(a, b);
}

export fn max_i64(a: i64, b: i64) i64 {
    return @max(a, b);
}

export fn max_f32(a: f32, b: f32) f32 {
    return @max(a, b);
}

export fn max_f64(a: f64, b: f64) f64 {
    return @max(a, b);
}

/// Clamp value between min and max
export fn clamp_i32(val: i32, lo: i32, hi: i32) i32 {
    return std.math.clamp(val, lo, hi);
}

export fn clamp_f32(val: f32, lo: f32, hi: f32) f32 {
    return std.math.clamp(val, lo, hi);
}

export fn clamp_f64(val: f64, lo: f64, hi: f64) f64 {
    return std.math.clamp(val, lo, hi);
}

// ============================================================================
// Power and roots
// ============================================================================

/// Square root
export fn sqrt_f32(x: f32) f32 {
    return @sqrt(x);
}

export fn sqrt_f64(x: f64) f64 {
    return @sqrt(x);
}

/// Cube root
export fn cbrt_f32(x: f32) f32 {
    return math.cbrt(x);
}

export fn cbrt_f64(x: f64) f64 {
    return math.cbrt(x);
}

/// Power function
export fn pow_f32(base: f32, exp: f32) f32 {
    return math.pow(f32, base, exp);
}

export fn pow_f64(base: f64, exp: f64) f64 {
    return math.pow(f64, base, exp);
}

/// Hypotenuse (sqrt(x^2 + y^2))
export fn hypot_f32(x: f32, y: f32) f32 {
    return math.hypot(x, y);
}

export fn hypot_f64(x: f64, y: f64) f64 {
    return math.hypot(x, y);
}

// ============================================================================
// Exponential and logarithm
// ============================================================================

/// e^x
export fn exp_f32(x: f32) f32 {
    return @exp(x);
}

export fn exp_f64(x: f64) f64 {
    return @exp(x);
}

/// 2^x
export fn exp2_f32(x: f32) f32 {
    return @exp2(x);
}

export fn exp2_f64(x: f64) f64 {
    return @exp2(x);
}

/// e^x - 1 (accurate for small x)
export fn expm1_f32(x: f32) f32 {
    return math.expm1(x);
}

export fn expm1_f64(x: f64) f64 {
    return math.expm1(x);
}

/// Natural logarithm
export fn log_f32(x: f32) f32 {
    return @log(x);
}

export fn log_f64(x: f64) f64 {
    return @log(x);
}

/// Base-2 logarithm
export fn log2_f32(x: f32) f32 {
    return @log2(x);
}

export fn log2_f64(x: f64) f64 {
    return @log2(x);
}

/// Base-10 logarithm
export fn log10_f32(x: f32) f32 {
    return @log10(x);
}

export fn log10_f64(x: f64) f64 {
    return @log10(x);
}

/// log(1 + x) (accurate for small x)
export fn log1p_f32(x: f32) f32 {
    return math.log1p(x);
}

export fn log1p_f64(x: f64) f64 {
    return math.log1p(x);
}

// ============================================================================
// Trigonometric functions
// ============================================================================

/// Sine
export fn sin_f32(x: f32) f32 {
    return @sin(x);
}

export fn sin_f64(x: f64) f64 {
    return @sin(x);
}

/// Cosine
export fn cos_f32(x: f32) f32 {
    return @cos(x);
}

export fn cos_f64(x: f64) f64 {
    return @cos(x);
}

/// Tangent
export fn tan_f32(x: f32) f32 {
    return @tan(x);
}

export fn tan_f64(x: f64) f64 {
    return @tan(x);
}

/// Arc sine
export fn asin_f32(x: f32) f32 {
    return math.asin(x);
}

export fn asin_f64(x: f64) f64 {
    return math.asin(x);
}

/// Arc cosine
export fn acos_f32(x: f32) f32 {
    return math.acos(x);
}

export fn acos_f64(x: f64) f64 {
    return math.acos(x);
}

/// Arc tangent
export fn atan_f32(x: f32) f32 {
    return math.atan(x);
}

export fn atan_f64(x: f64) f64 {
    return math.atan(x);
}

/// Arc tangent of y/x
export fn atan2_f32(y: f32, x: f32) f32 {
    return math.atan2(y, x);
}

export fn atan2_f64(y: f64, x: f64) f64 {
    return math.atan2(y, x);
}

// ============================================================================
// Hyperbolic functions
// ============================================================================

/// Hyperbolic sine
export fn sinh_f32(x: f32) f32 {
    return math.sinh(x);
}

export fn sinh_f64(x: f64) f64 {
    return math.sinh(x);
}

/// Hyperbolic cosine
export fn cosh_f32(x: f32) f32 {
    return math.cosh(x);
}

export fn cosh_f64(x: f64) f64 {
    return math.cosh(x);
}

/// Hyperbolic tangent
export fn tanh_f32(x: f32) f32 {
    return math.tanh(x);
}

export fn tanh_f64(x: f64) f64 {
    return math.tanh(x);
}

/// Inverse hyperbolic sine
export fn asinh_f32(x: f32) f32 {
    return math.asinh(x);
}

export fn asinh_f64(x: f64) f64 {
    return math.asinh(x);
}

/// Inverse hyperbolic cosine
export fn acosh_f32(x: f32) f32 {
    return math.acosh(x);
}

export fn acosh_f64(x: f64) f64 {
    return math.acosh(x);
}

/// Inverse hyperbolic tangent
export fn atanh_f32(x: f32) f32 {
    return math.atanh(x);
}

export fn atanh_f64(x: f64) f64 {
    return math.atanh(x);
}

// ============================================================================
// Rounding
// ============================================================================

/// Floor
export fn floor_f32(x: f32) f32 {
    return @floor(x);
}

export fn floor_f64(x: f64) f64 {
    return @floor(x);
}

/// Ceiling
export fn ceil_f32(x: f32) f32 {
    return @ceil(x);
}

export fn ceil_f64(x: f64) f64 {
    return @ceil(x);
}

/// Round to nearest integer
export fn round_f32(x: f32) f32 {
    return @round(x);
}

export fn round_f64(x: f64) f64 {
    return @round(x);
}

/// Truncate towards zero
export fn trunc_f32(x: f32) f32 {
    return @trunc(x);
}

export fn trunc_f64(x: f64) f64 {
    return @trunc(x);
}

// ============================================================================
// Special values and checks
// ============================================================================

/// Check if NaN
export fn isnan_f32(x: f32) bool {
    return math.isNan(x);
}

export fn isnan_f64(x: f64) bool {
    return math.isNan(x);
}

/// Check if infinite
export fn isinf_f32(x: f32) bool {
    return math.isInf(x);
}

export fn isinf_f64(x: f64) bool {
    return math.isInf(x);
}

/// Check if finite
export fn isfinite_f32(x: f32) bool {
    return math.isFinite(x);
}

export fn isfinite_f64(x: f64) bool {
    return math.isFinite(x);
}

/// Sign of a number (-1, 0, or 1)
export fn sign_f32(x: f32) f32 {
    return math.sign(x);
}

export fn sign_f64(x: f64) f64 {
    return math.sign(x);
}

// ============================================================================
// Constants
// ============================================================================

/// Pi
export fn pi_f32() f32 {
    return math.pi;
}

export fn pi_f64() f64 {
    return math.pi;
}

/// e (Euler's number)
export fn e_f32() f32 {
    return math.e;
}

export fn e_f64() f64 {
    return math.e;
}

/// Natural log of 2
export fn ln2_f64() f64 {
    return math.ln2;
}

/// Natural log of 10
export fn ln10_f64() f64 {
    return math.ln10;
}

// ============================================================================
// Bit manipulation
// ============================================================================

/// Count leading zeros
export fn clz_u32(x: u32) u32 {
    return @clz(x);
}

export fn clz_u64(x: u64) u64 {
    return @clz(x);
}

/// Count trailing zeros
export fn ctz_u32(x: u32) u32 {
    return @ctz(x);
}

export fn ctz_u64(x: u64) u64 {
    return @ctz(x);
}

/// Population count (number of set bits)
export fn popcount_u32(x: u32) u32 {
    return @popCount(x);
}

export fn popcount_u64(x: u64) u64 {
    return @popCount(x);
}

/// Byte swap
export fn bswap_u16(x: u16) u16 {
    return @byteSwap(x);
}

export fn bswap_u32(x: u32) u32 {
    return @byteSwap(x);
}

export fn bswap_u64(x: u64) u64 {
    return @byteSwap(x);
}

/// Rotate left
export fn rotl_u32(x: u32, r: u32) u32 {
    return math.rotl(u32, x, @as(u5, @truncate(r)));
}

export fn rotl_u64(x: u64, r: u32) u64 {
    return math.rotl(u64, x, @as(u6, @truncate(r)));
}

/// Rotate right
export fn rotr_u32(x: u32, r: u32) u32 {
    return math.rotr(u32, x, @as(u5, @truncate(r)));
}

export fn rotr_u64(x: u64, r: u32) u64 {
    return math.rotr(u64, x, @as(u6, @truncate(r)));
}

// ============================================================================
// GCD/LCM
// ============================================================================

/// Greatest common divisor
export fn gcd_u32(a: u32, b: u32) u32 {
    return std.math.gcd(a, b);
}

export fn gcd_u64(a: u64, b: u64) u64 {
    return std.math.gcd(a, b);
}

// ============================================================================
// Float decomposition
// ============================================================================

/// Fractional and integer parts
export fn modf_f32(x: f32, int_part: *f32) f32 {
    const result = math.modf(x);
    int_part.* = result.ipart;
    return result.fpart;
}

export fn modf_f64(x: f64, int_part: *f64) f64 {
    const result = math.modf(x);
    int_part.* = result.ipart;
    return result.fpart;
}

/// Floating point remainder
export fn fmod_f32(x: f32, y: f32) f32 {
    return @mod(x, y);
}

export fn fmod_f64(x: f64, y: f64) f64 {
    return @mod(x, y);
}

/// Copy sign
export fn copysign_f32(mag: f32, sgn: f32) f32 {
    return math.copysign(mag, sgn);
}

export fn copysign_f64(mag: f64, sgn: f64) f64 {
    return math.copysign(mag, sgn);
}
