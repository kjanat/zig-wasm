/**
 * Type definitions for the @zig-wasm/math WASM module exports.
 *
 * This module defines the {@link MathWasmExports} interface which represents
 * all functions exported by the underlying Zig WASM module.
 *
 * @module types
 */

import type { WasmMemoryExports } from "@zig-wasm/core";

/**
 * Raw exports from the math WASM module.
 *
 * This interface defines all functions available from the compiled Zig WASM binary.
 * Most users should use the higher-level async/sync APIs from the main module instead.
 *
 * ## Naming Convention
 *
 * Functions follow the pattern `operation_type` where:
 * - `operation` is the math operation (e.g., `sin`, `cos`, `sqrt`)
 * - `type` is the numeric type: `f32`, `f64`, `i32`, `i64`, `u32`, `u64`
 *
 * @example Direct usage (advanced)
 * ```ts
 * import { getExports } from "@zig-wasm/math";
 *
 * const exports = await getExports();
 * const result = exports.sin_f64(Math.PI / 2);
 * ```
 */
export interface MathWasmExports extends WasmMemoryExports {
  [key: string]: unknown;

  // ============================================================================
  // Basic operations
  // ============================================================================

  /** Absolute value (f32) */
  abs_f32: (x: number) => number;
  /** Absolute value (f64) */
  abs_f64: (x: number) => number;
  /** Absolute value (i32) */
  abs_i32: (x: number) => number;
  /** Absolute value (i64) */
  abs_i64: (x: bigint) => bigint;

  /** Minimum of two values (f32) */
  min_f32: (a: number, b: number) => number;
  /** Minimum of two values (f64) */
  min_f64: (a: number, b: number) => number;
  /** Minimum of two values (i32) */
  min_i32: (a: number, b: number) => number;
  /** Minimum of two values (i64) */
  min_i64: (a: bigint, b: bigint) => bigint;
  /** Minimum of two values (u32) */
  min_u32: (a: number, b: number) => number;
  /** Minimum of two values (u64) */
  min_u64: (a: bigint, b: bigint) => bigint;

  /** Maximum of two values (f32) */
  max_f32: (a: number, b: number) => number;
  /** Maximum of two values (f64) */
  max_f64: (a: number, b: number) => number;
  /** Maximum of two values (i32) */
  max_i32: (a: number, b: number) => number;
  /** Maximum of two values (i64) */
  max_i64: (a: bigint, b: bigint) => bigint;
  /** Maximum of two values (u32) */
  max_u32: (a: number, b: number) => number;
  /** Maximum of two values (u64) */
  max_u64: (a: bigint, b: bigint) => bigint;

  /** Clamp value to range [lo, hi] (f32) */
  clamp_f32: (val: number, lo: number, hi: number) => number;
  /** Clamp value to range [lo, hi] (f64) */
  clamp_f64: (val: number, lo: number, hi: number) => number;
  /** Clamp value to range [lo, hi] (i32) */
  clamp_i32: (val: number, lo: number, hi: number) => number;
  /** Clamp value to range [lo, hi] (i64) */
  clamp_i64: (val: bigint, lo: bigint, hi: bigint) => bigint;
  /** Clamp value to range [lo, hi] (u32) */
  clamp_u32: (val: number, lo: number, hi: number) => number;
  /** Clamp value to range [lo, hi] (u64) */
  clamp_u64: (val: bigint, lo: bigint, hi: bigint) => bigint;

  // ============================================================================
  // Power and root functions
  // ============================================================================

  /** Square root (f32) */
  sqrt_f32: (x: number) => number;
  /** Square root (f64) */
  sqrt_f64: (x: number) => number;

  /** Cube root (f32) */
  cbrt_f32: (x: number) => number;
  /** Cube root (f64) */
  cbrt_f64: (x: number) => number;

  /** Power: base^exp (f32) */
  pow_f32: (base: number, exp: number) => number;
  /** Power: base^exp (f64) */
  pow_f64: (base: number, exp: number) => number;

  /** Hypotenuse: sqrt(x^2 + y^2) (f32) */
  hypot_f32: (x: number, y: number) => number;
  /** Hypotenuse: sqrt(x^2 + y^2) (f64) */
  hypot_f64: (x: number, y: number) => number;

  // ============================================================================
  // Exponential and logarithmic functions
  // ============================================================================

  /** e^x (f32) */
  exp_f32: (x: number) => number;
  /** e^x (f64) */
  exp_f64: (x: number) => number;

  /** 2^x (f32) */
  exp2_f32: (x: number) => number;
  /** 2^x (f64) */
  exp2_f64: (x: number) => number;

  /** e^x - 1 (f32) */
  expm1_f32: (x: number) => number;
  /** e^x - 1 (f64) */
  expm1_f64: (x: number) => number;

  /** Natural logarithm (f32) */
  log_f32: (x: number) => number;
  /** Natural logarithm (f64) */
  log_f64: (x: number) => number;

  /** Base-2 logarithm (f32) */
  log2_f32: (x: number) => number;
  /** Base-2 logarithm (f64) */
  log2_f64: (x: number) => number;

  /** Base-10 logarithm (f32) */
  log10_f32: (x: number) => number;
  /** Base-10 logarithm (f64) */
  log10_f64: (x: number) => number;

  /** ln(1 + x) (f32) */
  log1p_f32: (x: number) => number;
  /** ln(1 + x) (f64) */
  log1p_f64: (x: number) => number;

  // ============================================================================
  // Trigonometric functions
  // ============================================================================

  /** Sine (f32) */
  sin_f32: (x: number) => number;
  /** Sine (f64) */
  sin_f64: (x: number) => number;

  /** Cosine (f32) */
  cos_f32: (x: number) => number;
  /** Cosine (f64) */
  cos_f64: (x: number) => number;

  /** Tangent (f32) */
  tan_f32: (x: number) => number;
  /** Tangent (f64) */
  tan_f64: (x: number) => number;

  /** Arc sine (f32) */
  asin_f32: (x: number) => number;
  /** Arc sine (f64) */
  asin_f64: (x: number) => number;

  /** Arc cosine (f32) */
  acos_f32: (x: number) => number;
  /** Arc cosine (f64) */
  acos_f64: (x: number) => number;

  /** Arc tangent (f32) */
  atan_f32: (x: number) => number;
  /** Arc tangent (f64) */
  atan_f64: (x: number) => number;

  /** Arc tangent of y/x (f32) */
  atan2_f32: (y: number, x: number) => number;
  /** Arc tangent of y/x (f64) */
  atan2_f64: (y: number, x: number) => number;

  // ============================================================================
  // Hyperbolic functions
  // ============================================================================

  /** Hyperbolic sine (f32) */
  sinh_f32: (x: number) => number;
  /** Hyperbolic sine (f64) */
  sinh_f64: (x: number) => number;

  /** Hyperbolic cosine (f32) */
  cosh_f32: (x: number) => number;
  /** Hyperbolic cosine (f64) */
  cosh_f64: (x: number) => number;

  /** Hyperbolic tangent (f32) */
  tanh_f32: (x: number) => number;
  /** Hyperbolic tangent (f64) */
  tanh_f64: (x: number) => number;

  /** Inverse hyperbolic sine (f32) */
  asinh_f32: (x: number) => number;
  /** Inverse hyperbolic sine (f64) */
  asinh_f64: (x: number) => number;

  /** Inverse hyperbolic cosine (f32) */
  acosh_f32: (x: number) => number;
  /** Inverse hyperbolic cosine (f64) */
  acosh_f64: (x: number) => number;

  /** Inverse hyperbolic tangent (f32) */
  atanh_f32: (x: number) => number;
  /** Inverse hyperbolic tangent (f64) */
  atanh_f64: (x: number) => number;

  // ============================================================================
  // Rounding functions
  // ============================================================================

  /** Round down to nearest integer (f32) */
  floor_f32: (x: number) => number;
  /** Round down to nearest integer (f64) */
  floor_f64: (x: number) => number;

  /** Round up to nearest integer (f32) */
  ceil_f32: (x: number) => number;
  /** Round up to nearest integer (f64) */
  ceil_f64: (x: number) => number;

  /** Round to nearest integer (f32) */
  round_f32: (x: number) => number;
  /** Round to nearest integer (f64) */
  round_f64: (x: number) => number;

  /** Truncate toward zero (f32) */
  trunc_f32: (x: number) => number;
  /** Truncate toward zero (f64) */
  trunc_f64: (x: number) => number;

  // ============================================================================
  // Classification functions
  // ============================================================================

  /** Check if NaN (f32). Returns 1 if true, 0 if false */
  isnan_f32: (x: number) => number;
  /** Check if NaN (f64). Returns 1 if true, 0 if false */
  isnan_f64: (x: number) => number;

  /** Check if infinite (f32). Returns 1 if true, 0 if false */
  isinf_f32: (x: number) => number;
  /** Check if infinite (f64). Returns 1 if true, 0 if false */
  isinf_f64: (x: number) => number;

  /** Check if finite (f32). Returns 1 if true, 0 if false */
  isfinite_f32: (x: number) => number;
  /** Check if finite (f64). Returns 1 if true, 0 if false */
  isfinite_f64: (x: number) => number;

  /** Get sign: -1, 0, or 1 (f32) */
  sign_f32: (x: number) => number;
  /** Get sign: -1, 0, or 1 (f64) */
  sign_f64: (x: number) => number;

  // ============================================================================
  // Constants
  // ============================================================================

  /** PI constant (f32) */
  pi_f32: () => number;
  /** PI constant (f64) */
  pi_f64: () => number;

  /** Euler's number e (f32) */
  e_f32: () => number;
  /** Euler's number e (f64) */
  e_f64: () => number;

  /** Natural log of 2 (f64) */
  ln2_f64: () => number;
  /** Natural log of 10 (f64) */
  ln10_f64: () => number;

  // ============================================================================
  // Bit manipulation
  // ============================================================================

  /** Count leading zeros (u32) */
  clz_u32: (x: number) => number;
  /** Count leading zeros (u64) */
  clz_u64: (x: bigint) => bigint;

  /** Count trailing zeros (u32) */
  ctz_u32: (x: number) => number;
  /** Count trailing zeros (u64) */
  ctz_u64: (x: bigint) => bigint;

  /** Population count / count set bits (u32) */
  popcount_u32: (x: number) => number;
  /** Population count / count set bits (u64) */
  popcount_u64: (x: bigint) => bigint;

  /** Byte swap (u16) */
  bswap_u16: (x: number) => number;
  /** Byte swap (u32) */
  bswap_u32: (x: number) => number;
  /** Byte swap (u64) */
  bswap_u64: (x: bigint) => bigint;

  /** Rotate bits left (u32) */
  rotl_u32: (x: number, r: number) => number;
  /** Rotate bits left (u64) */
  rotl_u64: (x: bigint, r: number) => bigint;

  /** Rotate bits right (u32) */
  rotr_u32: (x: number, r: number) => number;
  /** Rotate bits right (u64) */
  rotr_u64: (x: bigint, r: number) => bigint;

  // ============================================================================
  // Integer math
  // ============================================================================

  /** Greatest common divisor (u32) */
  gcd_u32: (a: number, b: number) => number;
  /** Greatest common divisor (u64) */
  gcd_u64: (a: bigint, b: bigint) => bigint;

  // ============================================================================
  // Floating-point utilities
  // ============================================================================

  /** Split into integer and fractional parts (f32) */
  modf_f32: (x: number, intPartPtr: number) => number;
  /** Split into integer and fractional parts (f64) */
  modf_f64: (x: number, intPartPtr: number) => number;

  /** Floating-point remainder (f32) */
  fmod_f32: (x: number, y: number) => number;
  /** Floating-point remainder (f64) */
  fmod_f64: (x: number, y: number) => number;

  /** Copy sign from one value to another (f32) */
  copysign_f32: (mag: number, sign: number) => number;
  /** Copy sign from one value to another (f64) */
  copysign_f64: (mag: number, sign: number) => number;
}
