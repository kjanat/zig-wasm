//! Integer arithmetic functions for the math WASM module.
//!
//! Provides greatest common divisor (GCD) and least common multiple (LCM)
//! functions for unsigned integer types (u32, u64).

const std = @import("std");

// Greatest Common Divisor

/// Computes the greatest common divisor of `a` and `b` (u32).
/// Uses the Euclidean algorithm. Returns `b` if `a` is 0, `a` if `b` is 0.
pub fn gcd_u32(a: u32, b: u32) u32 {
    return std.math.gcd(a, b);
}

/// Computes the greatest common divisor of `a` and `b` (u64).
/// Uses the Euclidean algorithm. Returns `b` if `a` is 0, `a` if `b` is 0.
pub fn gcd_u64(a: u64, b: u64) u64 {
    return std.math.gcd(a, b);
}

// Least Common Multiple

/// Computes the least common multiple of `a` and `b` (u32).
/// Returns 0 if either `a` or `b` is 0.
/// Formula: lcm(a, b) = (a / gcd(a, b)) * b
pub fn lcm_u32(a: u32, b: u32) u32 {
    if (a == 0 or b == 0) return 0;
    return (a / std.math.gcd(a, b)) * b;
}

/// Computes the least common multiple of `a` and `b` (u64).
/// Returns 0 if either `a` or `b` is 0.
/// Formula: lcm(a, b) = (a / gcd(a, b)) * b
pub fn lcm_u64(a: u64, b: u64) u64 {
    if (a == 0 or b == 0) return 0;
    return (a / std.math.gcd(a, b)) * b;
}
