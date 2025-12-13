import type { WasmMemoryExports } from "@zig-wasm/core";

/** Math WASM module exports */
export interface MathWasmExports extends WasmMemoryExports {
  [key: string]: unknown;
  // ============================================================================
  // Basic operations
  // ============================================================================
  abs_f32: (x: number) => number;
  abs_f64: (x: number) => number;
  abs_i32: (x: number) => number;
  abs_i64: (x: bigint) => bigint;

  min_f32: (a: number, b: number) => number;
  min_f64: (a: number, b: number) => number;
  min_i32: (a: number, b: number) => number;
  min_i64: (a: bigint, b: bigint) => bigint;
  min_u32: (a: number, b: number) => number;
  min_u64: (a: bigint, b: bigint) => bigint;

  max_f32: (a: number, b: number) => number;
  max_f64: (a: number, b: number) => number;
  max_i32: (a: number, b: number) => number;
  max_i64: (a: bigint, b: bigint) => bigint;
  max_u32: (a: number, b: number) => number;
  max_u64: (a: bigint, b: bigint) => bigint;

  clamp_f32: (val: number, lo: number, hi: number) => number;
  clamp_f64: (val: number, lo: number, hi: number) => number;
  clamp_i32: (val: number, lo: number, hi: number) => number;
  clamp_i64: (val: bigint, lo: bigint, hi: bigint) => bigint;
  clamp_u32: (val: number, lo: number, hi: number) => number;
  clamp_u64: (val: bigint, lo: bigint, hi: bigint) => bigint;

  // ============================================================================
  // Power and root functions
  // ============================================================================
  sqrt_f32: (x: number) => number;
  sqrt_f64: (x: number) => number;

  cbrt_f32: (x: number) => number;
  cbrt_f64: (x: number) => number;

  pow_f32: (base: number, exp: number) => number;
  pow_f64: (base: number, exp: number) => number;

  hypot_f32: (x: number, y: number) => number;
  hypot_f64: (x: number, y: number) => number;

  // ============================================================================
  // Exponential and logarithmic functions
  // ============================================================================
  exp_f32: (x: number) => number;
  exp_f64: (x: number) => number;

  exp2_f32: (x: number) => number;
  exp2_f64: (x: number) => number;

  expm1_f32: (x: number) => number;
  expm1_f64: (x: number) => number;

  log_f32: (x: number) => number;
  log_f64: (x: number) => number;

  log2_f32: (x: number) => number;
  log2_f64: (x: number) => number;

  log10_f32: (x: number) => number;
  log10_f64: (x: number) => number;

  log1p_f32: (x: number) => number;
  log1p_f64: (x: number) => number;

  // ============================================================================
  // Trigonometric functions
  // ============================================================================
  sin_f32: (x: number) => number;
  sin_f64: (x: number) => number;

  cos_f32: (x: number) => number;
  cos_f64: (x: number) => number;

  tan_f32: (x: number) => number;
  tan_f64: (x: number) => number;

  asin_f32: (x: number) => number;
  asin_f64: (x: number) => number;

  acos_f32: (x: number) => number;
  acos_f64: (x: number) => number;

  atan_f32: (x: number) => number;
  atan_f64: (x: number) => number;

  atan2_f32: (y: number, x: number) => number;
  atan2_f64: (y: number, x: number) => number;

  // ============================================================================
  // Hyperbolic functions
  // ============================================================================
  sinh_f32: (x: number) => number;
  sinh_f64: (x: number) => number;

  cosh_f32: (x: number) => number;
  cosh_f64: (x: number) => number;

  tanh_f32: (x: number) => number;
  tanh_f64: (x: number) => number;

  asinh_f32: (x: number) => number;
  asinh_f64: (x: number) => number;

  acosh_f32: (x: number) => number;
  acosh_f64: (x: number) => number;

  atanh_f32: (x: number) => number;
  atanh_f64: (x: number) => number;

  // ============================================================================
  // Rounding functions
  // ============================================================================
  floor_f32: (x: number) => number;
  floor_f64: (x: number) => number;

  ceil_f32: (x: number) => number;
  ceil_f64: (x: number) => number;

  round_f32: (x: number) => number;
  round_f64: (x: number) => number;

  trunc_f32: (x: number) => number;
  trunc_f64: (x: number) => number;

  // ============================================================================
  // Classification functions
  // ============================================================================
  isnan_f32: (x: number) => number;
  isnan_f64: (x: number) => number;

  isinf_f32: (x: number) => number;
  isinf_f64: (x: number) => number;

  isfinite_f32: (x: number) => number;
  isfinite_f64: (x: number) => number;

  sign_f32: (x: number) => number;
  sign_f64: (x: number) => number;

  // ============================================================================
  // Constants
  // ============================================================================
  pi_f32: () => number;
  pi_f64: () => number;

  e_f32: () => number;
  e_f64: () => number;

  ln2_f64: () => number;
  ln10_f64: () => number;

  // ============================================================================
  // Bit manipulation
  // ============================================================================
  clz_u32: (x: number) => number;
  clz_u64: (x: bigint) => bigint;

  ctz_u32: (x: number) => number;
  ctz_u64: (x: bigint) => bigint;

  popcount_u32: (x: number) => number;
  popcount_u64: (x: bigint) => bigint;

  bswap_u16: (x: number) => number;
  bswap_u32: (x: number) => number;
  bswap_u64: (x: bigint) => bigint;

  rotl_u32: (x: number, r: number) => number;
  rotl_u64: (x: bigint, r: number) => bigint;

  rotr_u32: (x: number, r: number) => number;
  rotr_u64: (x: bigint, r: number) => bigint;

  // ============================================================================
  // Integer math
  // ============================================================================
  gcd_u32: (a: number, b: number) => number;
  gcd_u64: (a: bigint, b: bigint) => bigint;

  // ============================================================================
  // Floating-point utilities
  // ============================================================================
  modf_f32: (x: number, intPartPtr: number) => number;
  modf_f64: (x: number, intPartPtr: number) => number;

  fmod_f32: (x: number, y: number) => number;
  fmod_f64: (x: number, y: number) => number;

  copysign_f32: (mag: number, sign: number) => number;
  copysign_f64: (mag: number, sign: number) => number;
}
