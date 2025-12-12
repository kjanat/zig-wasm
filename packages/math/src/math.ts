import type { WasmLoadResult } from "@zig-wasm/core";
import { getEnvironment, loadWasm } from "@zig-wasm/core";

import type { MathWasmExports } from "./types.ts";

// Lazy-loaded module
let wasmModule: Promise<WasmLoadResult<MathWasmExports>> | null = null;

/** Get or load the WASM module */
async function getModule(): Promise<MathWasmExports> {
  if (!wasmModule) {
    const env = getEnvironment();

    if (env.isNode || env.isBun) {
      // Node.js: load from file
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "math.wasm");
      wasmModule = loadWasm<MathWasmExports>({ wasmPath });
    } else {
      // Browser: load from URL relative to module
      const wasmUrl = new URL("math.wasm", import.meta.url);
      wasmModule = loadWasm<MathWasmExports>({ wasmUrl: wasmUrl.href });
    }
  }

  const result = await wasmModule;
  return result.exports;
}

// ============================================================================
// Basic operations
// ============================================================================

/** Absolute value (f64) */
export async function abs(x: number): Promise<number> {
  const m = await getModule();
  return m.abs_f64(x);
}

/** Absolute value (f32) */
export async function absF32(x: number): Promise<number> {
  const m = await getModule();
  return m.abs_f32(x);
}

/** Absolute value (i32) */
export async function absI32(x: number): Promise<number> {
  const m = await getModule();
  return m.abs_i32(x);
}

/** Absolute value (i64) */
export async function absI64(x: bigint): Promise<bigint> {
  const m = await getModule();
  return m.abs_i64(x);
}

/** Minimum of two values (f64) */
export async function min(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.min_f64(a, b);
}

/** Minimum of two values (f32) */
export async function minF32(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.min_f32(a, b);
}

/** Minimum of two values (i32) */
export async function minI32(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.min_i32(a, b);
}

/** Minimum of two values (i64) */
export async function minI64(a: bigint, b: bigint): Promise<bigint> {
  const m = await getModule();
  return m.min_i64(a, b);
}

/** Minimum of two values (u32) */
export async function minU32(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.min_u32(a, b);
}

/** Minimum of two values (u64) */
export async function minU64(a: bigint, b: bigint): Promise<bigint> {
  const m = await getModule();
  return m.min_u64(a, b);
}

/** Maximum of two values (f64) */
export async function max(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.max_f64(a, b);
}

/** Maximum of two values (f32) */
export async function maxF32(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.max_f32(a, b);
}

/** Maximum of two values (i32) */
export async function maxI32(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.max_i32(a, b);
}

/** Maximum of two values (i64) */
export async function maxI64(a: bigint, b: bigint): Promise<bigint> {
  const m = await getModule();
  return m.max_i64(a, b);
}

/** Maximum of two values (u32) */
export async function maxU32(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.max_u32(a, b);
}

/** Maximum of two values (u64) */
export async function maxU64(a: bigint, b: bigint): Promise<bigint> {
  const m = await getModule();
  return m.max_u64(a, b);
}

/** Clamp value to range (f64) */
export async function clamp(val: number, lo: number, hi: number): Promise<number> {
  const m = await getModule();
  return m.clamp_f64(val, lo, hi);
}

/** Clamp value to range (f32) */
export async function clampF32(val: number, lo: number, hi: number): Promise<number> {
  const m = await getModule();
  return m.clamp_f32(val, lo, hi);
}

/** Clamp value to range (i32) */
export async function clampI32(val: number, lo: number, hi: number): Promise<number> {
  const m = await getModule();
  return m.clamp_i32(val, lo, hi);
}

/** Clamp value to range (i64) */
export async function clampI64(val: bigint, lo: bigint, hi: bigint): Promise<bigint> {
  const m = await getModule();
  return m.clamp_i64(val, lo, hi);
}

/** Clamp value to range (u32) */
export async function clampU32(val: number, lo: number, hi: number): Promise<number> {
  const m = await getModule();
  return m.clamp_u32(val, lo, hi);
}

/** Clamp value to range (u64) */
export async function clampU64(val: bigint, lo: bigint, hi: bigint): Promise<bigint> {
  const m = await getModule();
  return m.clamp_u64(val, lo, hi);
}

// ============================================================================
// Power and root functions
// ============================================================================

/** Square root (f64) */
export async function sqrt(x: number): Promise<number> {
  const m = await getModule();
  return m.sqrt_f64(x);
}

/** Square root (f32) */
export async function sqrtF32(x: number): Promise<number> {
  const m = await getModule();
  return m.sqrt_f32(x);
}

/** Cube root (f64) */
export async function cbrt(x: number): Promise<number> {
  const m = await getModule();
  return m.cbrt_f64(x);
}

/** Cube root (f32) */
export async function cbrtF32(x: number): Promise<number> {
  const m = await getModule();
  return m.cbrt_f32(x);
}

/** Power (f64) */
export async function pow(base: number, exp: number): Promise<number> {
  const m = await getModule();
  return m.pow_f64(base, exp);
}

/** Power (f32) */
export async function powF32(base: number, exp: number): Promise<number> {
  const m = await getModule();
  return m.pow_f32(base, exp);
}

/** Hypotenuse sqrt(x^2 + y^2) (f64) */
export async function hypot(x: number, y: number): Promise<number> {
  const m = await getModule();
  return m.hypot_f64(x, y);
}

/** Hypotenuse sqrt(x^2 + y^2) (f32) */
export async function hypotF32(x: number, y: number): Promise<number> {
  const m = await getModule();
  return m.hypot_f32(x, y);
}

// ============================================================================
// Exponential and logarithmic functions
// ============================================================================

/** Exponential e^x (f64) */
export async function exp(x: number): Promise<number> {
  const m = await getModule();
  return m.exp_f64(x);
}

/** Exponential e^x (f32) */
export async function expF32(x: number): Promise<number> {
  const m = await getModule();
  return m.exp_f32(x);
}

/** Exponential 2^x (f64) */
export async function exp2(x: number): Promise<number> {
  const m = await getModule();
  return m.exp2_f64(x);
}

/** Exponential 2^x (f32) */
export async function exp2F32(x: number): Promise<number> {
  const m = await getModule();
  return m.exp2_f32(x);
}

/** Exponential e^x - 1 (f64) */
export async function expm1(x: number): Promise<number> {
  const m = await getModule();
  return m.expm1_f64(x);
}

/** Exponential e^x - 1 (f32) */
export async function expm1F32(x: number): Promise<number> {
  const m = await getModule();
  return m.expm1_f32(x);
}

/** Natural logarithm (f64) */
export async function log(x: number): Promise<number> {
  const m = await getModule();
  return m.log_f64(x);
}

/** Natural logarithm (f32) */
export async function logF32(x: number): Promise<number> {
  const m = await getModule();
  return m.log_f32(x);
}

/** Base-2 logarithm (f64) */
export async function log2(x: number): Promise<number> {
  const m = await getModule();
  return m.log2_f64(x);
}

/** Base-2 logarithm (f32) */
export async function log2F32(x: number): Promise<number> {
  const m = await getModule();
  return m.log2_f32(x);
}

/** Base-10 logarithm (f64) */
export async function log10(x: number): Promise<number> {
  const m = await getModule();
  return m.log10_f64(x);
}

/** Base-10 logarithm (f32) */
export async function log10F32(x: number): Promise<number> {
  const m = await getModule();
  return m.log10_f32(x);
}

/** Natural logarithm of 1+x (f64) */
export async function log1p(x: number): Promise<number> {
  const m = await getModule();
  return m.log1p_f64(x);
}

/** Natural logarithm of 1+x (f32) */
export async function log1pF32(x: number): Promise<number> {
  const m = await getModule();
  return m.log1p_f32(x);
}

// ============================================================================
// Trigonometric functions
// ============================================================================

/** Sine (f64) */
export async function sin(x: number): Promise<number> {
  const m = await getModule();
  return m.sin_f64(x);
}

/** Sine (f32) */
export async function sinF32(x: number): Promise<number> {
  const m = await getModule();
  return m.sin_f32(x);
}

/** Cosine (f64) */
export async function cos(x: number): Promise<number> {
  const m = await getModule();
  return m.cos_f64(x);
}

/** Cosine (f32) */
export async function cosF32(x: number): Promise<number> {
  const m = await getModule();
  return m.cos_f32(x);
}

/** Tangent (f64) */
export async function tan(x: number): Promise<number> {
  const m = await getModule();
  return m.tan_f64(x);
}

/** Tangent (f32) */
export async function tanF32(x: number): Promise<number> {
  const m = await getModule();
  return m.tan_f32(x);
}

/** Arc sine (f64) */
export async function asin(x: number): Promise<number> {
  const m = await getModule();
  return m.asin_f64(x);
}

/** Arc sine (f32) */
export async function asinF32(x: number): Promise<number> {
  const m = await getModule();
  return m.asin_f32(x);
}

/** Arc cosine (f64) */
export async function acos(x: number): Promise<number> {
  const m = await getModule();
  return m.acos_f64(x);
}

/** Arc cosine (f32) */
export async function acosF32(x: number): Promise<number> {
  const m = await getModule();
  return m.acos_f32(x);
}

/** Arc tangent (f64) */
export async function atan(x: number): Promise<number> {
  const m = await getModule();
  return m.atan_f64(x);
}

/** Arc tangent (f32) */
export async function atanF32(x: number): Promise<number> {
  const m = await getModule();
  return m.atan_f32(x);
}

/** Arc tangent of y/x (f64) */
export async function atan2(y: number, x: number): Promise<number> {
  const m = await getModule();
  return m.atan2_f64(y, x);
}

/** Arc tangent of y/x (f32) */
export async function atan2F32(y: number, x: number): Promise<number> {
  const m = await getModule();
  return m.atan2_f32(y, x);
}

// ============================================================================
// Hyperbolic functions
// ============================================================================

/** Hyperbolic sine (f64) */
export async function sinh(x: number): Promise<number> {
  const m = await getModule();
  return m.sinh_f64(x);
}

/** Hyperbolic sine (f32) */
export async function sinhF32(x: number): Promise<number> {
  const m = await getModule();
  return m.sinh_f32(x);
}

/** Hyperbolic cosine (f64) */
export async function cosh(x: number): Promise<number> {
  const m = await getModule();
  return m.cosh_f64(x);
}

/** Hyperbolic cosine (f32) */
export async function coshF32(x: number): Promise<number> {
  const m = await getModule();
  return m.cosh_f32(x);
}

/** Hyperbolic tangent (f64) */
export async function tanh(x: number): Promise<number> {
  const m = await getModule();
  return m.tanh_f64(x);
}

/** Hyperbolic tangent (f32) */
export async function tanhF32(x: number): Promise<number> {
  const m = await getModule();
  return m.tanh_f32(x);
}

/** Inverse hyperbolic sine (f64) */
export async function asinh(x: number): Promise<number> {
  const m = await getModule();
  return m.asinh_f64(x);
}

/** Inverse hyperbolic sine (f32) */
export async function asinhF32(x: number): Promise<number> {
  const m = await getModule();
  return m.asinh_f32(x);
}

/** Inverse hyperbolic cosine (f64) */
export async function acosh(x: number): Promise<number> {
  const m = await getModule();
  return m.acosh_f64(x);
}

/** Inverse hyperbolic cosine (f32) */
export async function acoshF32(x: number): Promise<number> {
  const m = await getModule();
  return m.acosh_f32(x);
}

/** Inverse hyperbolic tangent (f64) */
export async function atanh(x: number): Promise<number> {
  const m = await getModule();
  return m.atanh_f64(x);
}

/** Inverse hyperbolic tangent (f32) */
export async function atanhF32(x: number): Promise<number> {
  const m = await getModule();
  return m.atanh_f32(x);
}

// ============================================================================
// Rounding functions
// ============================================================================

/** Floor (f64) */
export async function floor(x: number): Promise<number> {
  const m = await getModule();
  return m.floor_f64(x);
}

/** Floor (f32) */
export async function floorF32(x: number): Promise<number> {
  const m = await getModule();
  return m.floor_f32(x);
}

/** Ceiling (f64) */
export async function ceil(x: number): Promise<number> {
  const m = await getModule();
  return m.ceil_f64(x);
}

/** Ceiling (f32) */
export async function ceilF32(x: number): Promise<number> {
  const m = await getModule();
  return m.ceil_f32(x);
}

/** Round to nearest (f64) */
export async function round(x: number): Promise<number> {
  const m = await getModule();
  return m.round_f64(x);
}

/** Round to nearest (f32) */
export async function roundF32(x: number): Promise<number> {
  const m = await getModule();
  return m.round_f32(x);
}

/** Truncate toward zero (f64) */
export async function trunc(x: number): Promise<number> {
  const m = await getModule();
  return m.trunc_f64(x);
}

/** Truncate toward zero (f32) */
export async function truncF32(x: number): Promise<number> {
  const m = await getModule();
  return m.trunc_f32(x);
}

// ============================================================================
// Classification functions
// ============================================================================

/** Check if NaN (f64) */
export async function isNaN_(x: number): Promise<boolean> {
  const m = await getModule();
  return m.isnan_f64(x) !== 0;
}

/** Check if NaN (f32) */
export async function isNaN_F32(x: number): Promise<boolean> {
  const m = await getModule();
  return m.isnan_f32(x) !== 0;
}

/** Check if infinite (f64) */
export async function isInf(x: number): Promise<boolean> {
  const m = await getModule();
  return m.isinf_f64(x) !== 0;
}

/** Check if infinite (f32) */
export async function isInfF32(x: number): Promise<boolean> {
  const m = await getModule();
  return m.isinf_f32(x) !== 0;
}

/** Check if finite (f64) */
export async function isFinite_(x: number): Promise<boolean> {
  const m = await getModule();
  return m.isfinite_f64(x) !== 0;
}

/** Check if finite (f32) */
export async function isFinite_F32(x: number): Promise<boolean> {
  const m = await getModule();
  return m.isfinite_f32(x) !== 0;
}

/** Sign of value: -1, 0, or 1 (f64) */
export async function sign(x: number): Promise<number> {
  const m = await getModule();
  return m.sign_f64(x);
}

/** Sign of value: -1, 0, or 1 (f32) */
export async function signF32(x: number): Promise<number> {
  const m = await getModule();
  return m.sign_f32(x);
}

// ============================================================================
// Constants
// ============================================================================

/** Pi (f64) */
export async function pi(): Promise<number> {
  const m = await getModule();
  return m.pi_f64();
}

/** Pi (f32) */
export async function piF32(): Promise<number> {
  const m = await getModule();
  return m.pi_f32();
}

/** Euler's number e (f64) */
export async function e(): Promise<number> {
  const m = await getModule();
  return m.e_f64();
}

/** Euler's number e (f32) */
export async function eF32(): Promise<number> {
  const m = await getModule();
  return m.e_f32();
}

/** Natural log of 2 */
export async function ln2(): Promise<number> {
  const m = await getModule();
  return m.ln2_f64();
}

/** Natural log of 10 */
export async function ln10(): Promise<number> {
  const m = await getModule();
  return m.ln10_f64();
}

// ============================================================================
// Bit manipulation
// ============================================================================

/** Count leading zeros (u32) */
export async function clz(x: number): Promise<number> {
  const m = await getModule();
  return m.clz_u32(x);
}

/** Count leading zeros (u64) */
export async function clzU64(x: bigint): Promise<bigint> {
  const m = await getModule();
  return m.clz_u64(x);
}

/** Count trailing zeros (u32) */
export async function ctz(x: number): Promise<number> {
  const m = await getModule();
  return m.ctz_u32(x);
}

/** Count trailing zeros (u64) */
export async function ctzU64(x: bigint): Promise<bigint> {
  const m = await getModule();
  return m.ctz_u64(x);
}

/** Population count (count set bits) (u32) */
export async function popcount(x: number): Promise<number> {
  const m = await getModule();
  return m.popcount_u32(x);
}

/** Population count (count set bits) (u64) */
export async function popcountU64(x: bigint): Promise<bigint> {
  const m = await getModule();
  return m.popcount_u64(x);
}

/** Byte swap (u16) */
export async function bswap16(x: number): Promise<number> {
  const m = await getModule();
  return m.bswap_u16(x);
}

/** Byte swap (u32) */
export async function bswap32(x: number): Promise<number> {
  const m = await getModule();
  return m.bswap_u32(x);
}

/** Byte swap (u64) */
export async function bswap64(x: bigint): Promise<bigint> {
  const m = await getModule();
  return m.bswap_u64(x);
}

/** Rotate left (u32) */
export async function rotl(x: number, r: number): Promise<number> {
  const m = await getModule();
  return m.rotl_u32(x, r);
}

/** Rotate left (u64) */
export async function rotlU64(x: bigint, r: bigint): Promise<bigint> {
  const m = await getModule();
  return m.rotl_u64(x, r);
}

/** Rotate right (u32) */
export async function rotr(x: number, r: number): Promise<number> {
  const m = await getModule();
  return m.rotr_u32(x, r);
}

/** Rotate right (u64) */
export async function rotrU64(x: bigint, r: bigint): Promise<bigint> {
  const m = await getModule();
  return m.rotr_u64(x, r);
}

// ============================================================================
// Integer math
// ============================================================================

/** Greatest common divisor (u32) */
export async function gcd(a: number, b: number): Promise<number> {
  const m = await getModule();
  return m.gcd_u32(a, b);
}

/** Greatest common divisor (u64) */
export async function gcdU64(a: bigint, b: bigint): Promise<bigint> {
  const m = await getModule();
  return m.gcd_u64(a, b);
}

// ============================================================================
// Floating-point utilities
// ============================================================================

/** Floating-point modulo (f64) */
export async function fmod(x: number, y: number): Promise<number> {
  const m = await getModule();
  return m.fmod_f64(x, y);
}

/** Floating-point modulo (f32) */
export async function fmodF32(x: number, y: number): Promise<number> {
  const m = await getModule();
  return m.fmod_f32(x, y);
}

/** Copy sign from one value to another (f64) */
export async function copysign(mag: number, sgn: number): Promise<number> {
  const m = await getModule();
  return m.copysign_f64(mag, sgn);
}

/** Copy sign from one value to another (f32) */
export async function copysignF32(mag: number, sgn: number): Promise<number> {
  const m = await getModule();
  return m.copysign_f32(mag, sgn);
}

// ============================================================================
// Raw exports access
// ============================================================================

/** Get raw WASM exports for advanced usage */
export async function getExports(): Promise<MathWasmExports> {
  return getModule();
}
