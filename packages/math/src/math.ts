/**
 * Math module - high-performance math functions
 *
 * Provides both async (lazy-loading) and sync (requires init) APIs.
 */

import type { InitOptions } from "@zig-wasm/core";
import { getEnvironment, loadWasm, NotInitializedError } from "@zig-wasm/core";
import type { MathWasmExports } from "./types.ts";

// ============================================================================
// Module initialization
// ============================================================================

let wasmExports: MathWasmExports | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the math module (idempotent, concurrency-safe)
 */
export async function init(options?: InitOptions): Promise<void> {
  if (wasmExports) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    const env = getEnvironment();
    let result: Awaited<ReturnType<typeof loadWasm<MathWasmExports>>>;

    if (options?.wasmBytes) {
      result = await loadWasm<MathWasmExports>({ wasmBytes: options.wasmBytes, imports: options.imports });
    } else if (options?.wasmPath) {
      result = await loadWasm<MathWasmExports>({ wasmPath: options.wasmPath, imports: options.imports });
    } else if (options?.wasmUrl) {
      result = await loadWasm<MathWasmExports>({ wasmUrl: options.wasmUrl, imports: options.imports });
    } else if (env.isNode || env.isBun) {
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "math.wasm");
      result = await loadWasm<MathWasmExports>({ wasmPath });
    } else {
      const wasmUrl = new URL("math.wasm", import.meta.url);
      result = await loadWasm<MathWasmExports>({ wasmUrl: wasmUrl.href });
    }

    wasmExports = result.exports;
  })();

  await initPromise;
}

/**
 * Check if the module is initialized
 */
export function isInitialized(): boolean {
  return wasmExports !== null;
}

async function ensureInit(): Promise<MathWasmExports> {
  await init();
  // After init(), this is guaranteed to be set
  return wasmExports as MathWasmExports;
}

function getSyncExports(): MathWasmExports {
  if (!wasmExports) {
    throw new NotInitializedError("math");
  }
  return wasmExports;
}

/** Get raw WASM exports for advanced usage */
export async function getExports(): Promise<MathWasmExports> {
  return ensureInit();
}

/** Get raw WASM exports (sync) */
export function getExportsSync(): MathWasmExports {
  return getSyncExports();
}

// ============================================================================
// Async API - Basic operations
// ============================================================================

export async function abs(x: number): Promise<number> {
  return (await ensureInit()).abs_f64(x);
}
export async function absF32(x: number): Promise<number> {
  return (await ensureInit()).abs_f32(x);
}
export async function absI32(x: number): Promise<number> {
  return (await ensureInit()).abs_i32(x);
}
export async function absI64(x: bigint): Promise<bigint> {
  return (await ensureInit()).abs_i64(x);
}

export async function min(a: number, b: number): Promise<number> {
  return (await ensureInit()).min_f64(a, b);
}
export async function minF32(a: number, b: number): Promise<number> {
  return (await ensureInit()).min_f32(a, b);
}
export async function minI32(a: number, b: number): Promise<number> {
  return (await ensureInit()).min_i32(a, b);
}
export async function minI64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).min_i64(a, b);
}
export async function minU32(a: number, b: number): Promise<number> {
  return (await ensureInit()).min_u32(a, b);
}
export async function minU64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).min_u64(a, b);
}

export async function max(a: number, b: number): Promise<number> {
  return (await ensureInit()).max_f64(a, b);
}
export async function maxF32(a: number, b: number): Promise<number> {
  return (await ensureInit()).max_f32(a, b);
}
export async function maxI32(a: number, b: number): Promise<number> {
  return (await ensureInit()).max_i32(a, b);
}
export async function maxI64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).max_i64(a, b);
}
export async function maxU32(a: number, b: number): Promise<number> {
  return (await ensureInit()).max_u32(a, b);
}
export async function maxU64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).max_u64(a, b);
}

export async function clamp(val: number, lo: number, hi: number): Promise<number> {
  return (await ensureInit()).clamp_f64(val, lo, hi);
}
export async function clampF32(val: number, lo: number, hi: number): Promise<number> {
  return (await ensureInit()).clamp_f32(val, lo, hi);
}
export async function clampI32(val: number, lo: number, hi: number): Promise<number> {
  return (await ensureInit()).clamp_i32(val, lo, hi);
}
export async function clampI64(val: bigint, lo: bigint, hi: bigint): Promise<bigint> {
  return (await ensureInit()).clamp_i64(val, lo, hi);
}
export async function clampU32(val: number, lo: number, hi: number): Promise<number> {
  return (await ensureInit()).clamp_u32(val, lo, hi);
}
export async function clampU64(val: bigint, lo: bigint, hi: bigint): Promise<bigint> {
  return (await ensureInit()).clamp_u64(val, lo, hi);
}

// Power and root functions
export async function sqrt(x: number): Promise<number> {
  return (await ensureInit()).sqrt_f64(x);
}
export async function sqrtF32(x: number): Promise<number> {
  return (await ensureInit()).sqrt_f32(x);
}
export async function cbrt(x: number): Promise<number> {
  return (await ensureInit()).cbrt_f64(x);
}
export async function cbrtF32(x: number): Promise<number> {
  return (await ensureInit()).cbrt_f32(x);
}
export async function pow(base: number, exp: number): Promise<number> {
  return (await ensureInit()).pow_f64(base, exp);
}
export async function powF32(base: number, exp: number): Promise<number> {
  return (await ensureInit()).pow_f32(base, exp);
}
export async function hypot(x: number, y: number): Promise<number> {
  return (await ensureInit()).hypot_f64(x, y);
}
export async function hypotF32(x: number, y: number): Promise<number> {
  return (await ensureInit()).hypot_f32(x, y);
}

// Exponential and logarithmic functions
export async function exp(x: number): Promise<number> {
  return (await ensureInit()).exp_f64(x);
}
export async function expF32(x: number): Promise<number> {
  return (await ensureInit()).exp_f32(x);
}
export async function exp2(x: number): Promise<number> {
  return (await ensureInit()).exp2_f64(x);
}
export async function exp2F32(x: number): Promise<number> {
  return (await ensureInit()).exp2_f32(x);
}
export async function expm1(x: number): Promise<number> {
  return (await ensureInit()).expm1_f64(x);
}
export async function expm1F32(x: number): Promise<number> {
  return (await ensureInit()).expm1_f32(x);
}
export async function log(x: number): Promise<number> {
  return (await ensureInit()).log_f64(x);
}
export async function logF32(x: number): Promise<number> {
  return (await ensureInit()).log_f32(x);
}
export async function log2(x: number): Promise<number> {
  return (await ensureInit()).log2_f64(x);
}
export async function log2F32(x: number): Promise<number> {
  return (await ensureInit()).log2_f32(x);
}
export async function log10(x: number): Promise<number> {
  return (await ensureInit()).log10_f64(x);
}
export async function log10F32(x: number): Promise<number> {
  return (await ensureInit()).log10_f32(x);
}
export async function log1p(x: number): Promise<number> {
  return (await ensureInit()).log1p_f64(x);
}
export async function log1pF32(x: number): Promise<number> {
  return (await ensureInit()).log1p_f32(x);
}

// Trigonometric functions
export async function sin(x: number): Promise<number> {
  return (await ensureInit()).sin_f64(x);
}
export async function sinF32(x: number): Promise<number> {
  return (await ensureInit()).sin_f32(x);
}
export async function cos(x: number): Promise<number> {
  return (await ensureInit()).cos_f64(x);
}
export async function cosF32(x: number): Promise<number> {
  return (await ensureInit()).cos_f32(x);
}
export async function tan(x: number): Promise<number> {
  return (await ensureInit()).tan_f64(x);
}
export async function tanF32(x: number): Promise<number> {
  return (await ensureInit()).tan_f32(x);
}
export async function asin(x: number): Promise<number> {
  return (await ensureInit()).asin_f64(x);
}
export async function asinF32(x: number): Promise<number> {
  return (await ensureInit()).asin_f32(x);
}
export async function acos(x: number): Promise<number> {
  return (await ensureInit()).acos_f64(x);
}
export async function acosF32(x: number): Promise<number> {
  return (await ensureInit()).acos_f32(x);
}
export async function atan(x: number): Promise<number> {
  return (await ensureInit()).atan_f64(x);
}
export async function atanF32(x: number): Promise<number> {
  return (await ensureInit()).atan_f32(x);
}
export async function atan2(y: number, x: number): Promise<number> {
  return (await ensureInit()).atan2_f64(y, x);
}
export async function atan2F32(y: number, x: number): Promise<number> {
  return (await ensureInit()).atan2_f32(y, x);
}

// Hyperbolic functions
export async function sinh(x: number): Promise<number> {
  return (await ensureInit()).sinh_f64(x);
}
export async function sinhF32(x: number): Promise<number> {
  return (await ensureInit()).sinh_f32(x);
}
export async function cosh(x: number): Promise<number> {
  return (await ensureInit()).cosh_f64(x);
}
export async function coshF32(x: number): Promise<number> {
  return (await ensureInit()).cosh_f32(x);
}
export async function tanh(x: number): Promise<number> {
  return (await ensureInit()).tanh_f64(x);
}
export async function tanhF32(x: number): Promise<number> {
  return (await ensureInit()).tanh_f32(x);
}
export async function asinh(x: number): Promise<number> {
  return (await ensureInit()).asinh_f64(x);
}
export async function asinhF32(x: number): Promise<number> {
  return (await ensureInit()).asinh_f32(x);
}
export async function acosh(x: number): Promise<number> {
  return (await ensureInit()).acosh_f64(x);
}
export async function acoshF32(x: number): Promise<number> {
  return (await ensureInit()).acosh_f32(x);
}
export async function atanh(x: number): Promise<number> {
  return (await ensureInit()).atanh_f64(x);
}
export async function atanhF32(x: number): Promise<number> {
  return (await ensureInit()).atanh_f32(x);
}

// Rounding functions
export async function floor(x: number): Promise<number> {
  return (await ensureInit()).floor_f64(x);
}
export async function floorF32(x: number): Promise<number> {
  return (await ensureInit()).floor_f32(x);
}
export async function ceil(x: number): Promise<number> {
  return (await ensureInit()).ceil_f64(x);
}
export async function ceilF32(x: number): Promise<number> {
  return (await ensureInit()).ceil_f32(x);
}
export async function round(x: number): Promise<number> {
  return (await ensureInit()).round_f64(x);
}
export async function roundF32(x: number): Promise<number> {
  return (await ensureInit()).round_f32(x);
}
export async function trunc(x: number): Promise<number> {
  return (await ensureInit()).trunc_f64(x);
}
export async function truncF32(x: number): Promise<number> {
  return (await ensureInit()).trunc_f32(x);
}

// Classification functions
export async function isNaN_(x: number): Promise<boolean> {
  return (await ensureInit()).isnan_f64(x) !== 0;
}
export async function isNaN_F32(x: number): Promise<boolean> {
  return (await ensureInit()).isnan_f32(x) !== 0;
}
export async function isInf(x: number): Promise<boolean> {
  return (await ensureInit()).isinf_f64(x) !== 0;
}
export async function isInfF32(x: number): Promise<boolean> {
  return (await ensureInit()).isinf_f32(x) !== 0;
}
export async function isFinite_(x: number): Promise<boolean> {
  return (await ensureInit()).isfinite_f64(x) !== 0;
}
export async function isFinite_F32(x: number): Promise<boolean> {
  return (await ensureInit()).isfinite_f32(x) !== 0;
}
export async function sign(x: number): Promise<number> {
  return (await ensureInit()).sign_f64(x);
}
export async function signF32(x: number): Promise<number> {
  return (await ensureInit()).sign_f32(x);
}

// Constants
export async function pi(): Promise<number> {
  return (await ensureInit()).pi_f64();
}
export async function piF32(): Promise<number> {
  return (await ensureInit()).pi_f32();
}
export async function e(): Promise<number> {
  return (await ensureInit()).e_f64();
}
export async function eF32(): Promise<number> {
  return (await ensureInit()).e_f32();
}
export async function ln2(): Promise<number> {
  return (await ensureInit()).ln2_f64();
}
export async function ln10(): Promise<number> {
  return (await ensureInit()).ln10_f64();
}

// Bit manipulation
export async function clz(x: number): Promise<number> {
  return (await ensureInit()).clz_u32(x);
}
export async function clzU64(x: bigint): Promise<bigint> {
  return (await ensureInit()).clz_u64(x);
}
export async function ctz(x: number): Promise<number> {
  return (await ensureInit()).ctz_u32(x);
}
export async function ctzU64(x: bigint): Promise<bigint> {
  return (await ensureInit()).ctz_u64(x);
}
export async function popcount(x: number): Promise<number> {
  return (await ensureInit()).popcount_u32(x);
}
export async function popcountU64(x: bigint): Promise<bigint> {
  return (await ensureInit()).popcount_u64(x);
}
export async function bswap16(x: number): Promise<number> {
  return (await ensureInit()).bswap_u16(x);
}
export async function bswap32(x: number): Promise<number> {
  return (await ensureInit()).bswap_u32(x);
}
export async function bswap64(x: bigint): Promise<bigint> {
  return (await ensureInit()).bswap_u64(x);
}
export async function rotl(x: number, r: number): Promise<number> {
  return (await ensureInit()).rotl_u32(x, r);
}
export async function rotlU64(x: bigint, r: number): Promise<bigint> {
  return (await ensureInit()).rotl_u64(x, r);
}
export async function rotr(x: number, r: number): Promise<number> {
  return (await ensureInit()).rotr_u32(x, r);
}
export async function rotrU64(x: bigint, r: number): Promise<bigint> {
  return (await ensureInit()).rotr_u64(x, r);
}

// Integer math
export async function gcd(a: number, b: number): Promise<number> {
  return (await ensureInit()).gcd_u32(a, b);
}
export async function gcdU64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).gcd_u64(a, b);
}

// Floating-point utilities
export async function fmod(x: number, y: number): Promise<number> {
  return (await ensureInit()).fmod_f64(x, y);
}
export async function fmodF32(x: number, y: number): Promise<number> {
  return (await ensureInit()).fmod_f32(x, y);
}
export async function copysign(mag: number, sgn: number): Promise<number> {
  return (await ensureInit()).copysign_f64(mag, sgn);
}
export async function copysignF32(mag: number, sgn: number): Promise<number> {
  return (await ensureInit()).copysign_f32(mag, sgn);
}

// ============================================================================
// Sync API - Basic operations
// ============================================================================

export function absSync(x: number): number {
  return getSyncExports().abs_f64(x);
}
export function absF32Sync(x: number): number {
  return getSyncExports().abs_f32(x);
}
export function absI32Sync(x: number): number {
  return getSyncExports().abs_i32(x);
}
export function absI64Sync(x: bigint): bigint {
  return getSyncExports().abs_i64(x);
}

export function minSync(a: number, b: number): number {
  return getSyncExports().min_f64(a, b);
}
export function minF32Sync(a: number, b: number): number {
  return getSyncExports().min_f32(a, b);
}
export function minI32Sync(a: number, b: number): number {
  return getSyncExports().min_i32(a, b);
}
export function minI64Sync(a: bigint, b: bigint): bigint {
  return getSyncExports().min_i64(a, b);
}
export function minU32Sync(a: number, b: number): number {
  return getSyncExports().min_u32(a, b);
}
export function minU64Sync(a: bigint, b: bigint): bigint {
  return getSyncExports().min_u64(a, b);
}

export function maxSync(a: number, b: number): number {
  return getSyncExports().max_f64(a, b);
}
export function maxF32Sync(a: number, b: number): number {
  return getSyncExports().max_f32(a, b);
}
export function maxI32Sync(a: number, b: number): number {
  return getSyncExports().max_i32(a, b);
}
export function maxI64Sync(a: bigint, b: bigint): bigint {
  return getSyncExports().max_i64(a, b);
}
export function maxU32Sync(a: number, b: number): number {
  return getSyncExports().max_u32(a, b);
}
export function maxU64Sync(a: bigint, b: bigint): bigint {
  return getSyncExports().max_u64(a, b);
}

export function clampSync(val: number, lo: number, hi: number): number {
  return getSyncExports().clamp_f64(val, lo, hi);
}
export function clampF32Sync(val: number, lo: number, hi: number): number {
  return getSyncExports().clamp_f32(val, lo, hi);
}
export function clampI32Sync(val: number, lo: number, hi: number): number {
  return getSyncExports().clamp_i32(val, lo, hi);
}
export function clampI64Sync(val: bigint, lo: bigint, hi: bigint): bigint {
  return getSyncExports().clamp_i64(val, lo, hi);
}
export function clampU32Sync(val: number, lo: number, hi: number): number {
  return getSyncExports().clamp_u32(val, lo, hi);
}
export function clampU64Sync(val: bigint, lo: bigint, hi: bigint): bigint {
  return getSyncExports().clamp_u64(val, lo, hi);
}

// Power and root
export function sqrtSync(x: number): number {
  return getSyncExports().sqrt_f64(x);
}
export function sqrtF32Sync(x: number): number {
  return getSyncExports().sqrt_f32(x);
}
export function cbrtSync(x: number): number {
  return getSyncExports().cbrt_f64(x);
}
export function cbrtF32Sync(x: number): number {
  return getSyncExports().cbrt_f32(x);
}
export function powSync(base: number, exp: number): number {
  return getSyncExports().pow_f64(base, exp);
}
export function powF32Sync(base: number, exp: number): number {
  return getSyncExports().pow_f32(base, exp);
}
export function hypotSync(x: number, y: number): number {
  return getSyncExports().hypot_f64(x, y);
}
export function hypotF32Sync(x: number, y: number): number {
  return getSyncExports().hypot_f32(x, y);
}

// Exponential and logarithmic
export function expSync(x: number): number {
  return getSyncExports().exp_f64(x);
}
export function expF32Sync(x: number): number {
  return getSyncExports().exp_f32(x);
}
export function exp2Sync(x: number): number {
  return getSyncExports().exp2_f64(x);
}
export function exp2F32Sync(x: number): number {
  return getSyncExports().exp2_f32(x);
}
export function expm1Sync(x: number): number {
  return getSyncExports().expm1_f64(x);
}
export function expm1F32Sync(x: number): number {
  return getSyncExports().expm1_f32(x);
}
export function logSync(x: number): number {
  return getSyncExports().log_f64(x);
}
export function logF32Sync(x: number): number {
  return getSyncExports().log_f32(x);
}
export function log2Sync(x: number): number {
  return getSyncExports().log2_f64(x);
}
export function log2F32Sync(x: number): number {
  return getSyncExports().log2_f32(x);
}
export function log10Sync(x: number): number {
  return getSyncExports().log10_f64(x);
}
export function log10F32Sync(x: number): number {
  return getSyncExports().log10_f32(x);
}
export function log1pSync(x: number): number {
  return getSyncExports().log1p_f64(x);
}
export function log1pF32Sync(x: number): number {
  return getSyncExports().log1p_f32(x);
}

// Trigonometric
export function sinSync(x: number): number {
  return getSyncExports().sin_f64(x);
}
export function sinF32Sync(x: number): number {
  return getSyncExports().sin_f32(x);
}
export function cosSync(x: number): number {
  return getSyncExports().cos_f64(x);
}
export function cosF32Sync(x: number): number {
  return getSyncExports().cos_f32(x);
}
export function tanSync(x: number): number {
  return getSyncExports().tan_f64(x);
}
export function tanF32Sync(x: number): number {
  return getSyncExports().tan_f32(x);
}
export function asinSync(x: number): number {
  return getSyncExports().asin_f64(x);
}
export function asinF32Sync(x: number): number {
  return getSyncExports().asin_f32(x);
}
export function acosSync(x: number): number {
  return getSyncExports().acos_f64(x);
}
export function acosF32Sync(x: number): number {
  return getSyncExports().acos_f32(x);
}
export function atanSync(x: number): number {
  return getSyncExports().atan_f64(x);
}
export function atanF32Sync(x: number): number {
  return getSyncExports().atan_f32(x);
}
export function atan2Sync(y: number, x: number): number {
  return getSyncExports().atan2_f64(y, x);
}
export function atan2F32Sync(y: number, x: number): number {
  return getSyncExports().atan2_f32(y, x);
}

// Hyperbolic
export function sinhSync(x: number): number {
  return getSyncExports().sinh_f64(x);
}
export function sinhF32Sync(x: number): number {
  return getSyncExports().sinh_f32(x);
}
export function coshSync(x: number): number {
  return getSyncExports().cosh_f64(x);
}
export function coshF32Sync(x: number): number {
  return getSyncExports().cosh_f32(x);
}
export function tanhSync(x: number): number {
  return getSyncExports().tanh_f64(x);
}
export function tanhF32Sync(x: number): number {
  return getSyncExports().tanh_f32(x);
}
export function asinhSync(x: number): number {
  return getSyncExports().asinh_f64(x);
}
export function asinhF32Sync(x: number): number {
  return getSyncExports().asinh_f32(x);
}
export function acoshSync(x: number): number {
  return getSyncExports().acosh_f64(x);
}
export function acoshF32Sync(x: number): number {
  return getSyncExports().acosh_f32(x);
}
export function atanhSync(x: number): number {
  return getSyncExports().atanh_f64(x);
}
export function atanhF32Sync(x: number): number {
  return getSyncExports().atanh_f32(x);
}

// Rounding
export function floorSync(x: number): number {
  return getSyncExports().floor_f64(x);
}
export function floorF32Sync(x: number): number {
  return getSyncExports().floor_f32(x);
}
export function ceilSync(x: number): number {
  return getSyncExports().ceil_f64(x);
}
export function ceilF32Sync(x: number): number {
  return getSyncExports().ceil_f32(x);
}
export function roundSync(x: number): number {
  return getSyncExports().round_f64(x);
}
export function roundF32Sync(x: number): number {
  return getSyncExports().round_f32(x);
}
export function truncSync(x: number): number {
  return getSyncExports().trunc_f64(x);
}
export function truncF32Sync(x: number): number {
  return getSyncExports().trunc_f32(x);
}

// Classification
export function isNaN_Sync(x: number): boolean {
  return getSyncExports().isnan_f64(x) !== 0;
}
export function isNaN_F32Sync(x: number): boolean {
  return getSyncExports().isnan_f32(x) !== 0;
}
export function isInfSync(x: number): boolean {
  return getSyncExports().isinf_f64(x) !== 0;
}
export function isInfF32Sync(x: number): boolean {
  return getSyncExports().isinf_f32(x) !== 0;
}
export function isFinite_Sync(x: number): boolean {
  return getSyncExports().isfinite_f64(x) !== 0;
}
export function isFinite_F32Sync(x: number): boolean {
  return getSyncExports().isfinite_f32(x) !== 0;
}
export function signSync(x: number): number {
  return getSyncExports().sign_f64(x);
}
export function signF32Sync(x: number): number {
  return getSyncExports().sign_f32(x);
}

// Constants
export function piSync(): number {
  return getSyncExports().pi_f64();
}
export function piF32Sync(): number {
  return getSyncExports().pi_f32();
}
export function eSync(): number {
  return getSyncExports().e_f64();
}
export function eF32Sync(): number {
  return getSyncExports().e_f32();
}
export function ln2Sync(): number {
  return getSyncExports().ln2_f64();
}
export function ln10Sync(): number {
  return getSyncExports().ln10_f64();
}

// Bit manipulation
export function clzSync(x: number): number {
  return getSyncExports().clz_u32(x);
}
export function clzU64Sync(x: bigint): bigint {
  return getSyncExports().clz_u64(x);
}
export function ctzSync(x: number): number {
  return getSyncExports().ctz_u32(x);
}
export function ctzU64Sync(x: bigint): bigint {
  return getSyncExports().ctz_u64(x);
}
export function popcountSync(x: number): number {
  return getSyncExports().popcount_u32(x);
}
export function popcountU64Sync(x: bigint): bigint {
  return getSyncExports().popcount_u64(x);
}
export function bswap16Sync(x: number): number {
  return getSyncExports().bswap_u16(x);
}
export function bswap32Sync(x: number): number {
  return getSyncExports().bswap_u32(x);
}
export function bswap64Sync(x: bigint): bigint {
  return getSyncExports().bswap_u64(x);
}
export function rotlSync(x: number, r: number): number {
  return getSyncExports().rotl_u32(x, r);
}
export function rotlU64Sync(x: bigint, r: number): bigint {
  return getSyncExports().rotl_u64(x, r);
}
export function rotrSync(x: number, r: number): number {
  return getSyncExports().rotr_u32(x, r);
}
export function rotrU64Sync(x: bigint, r: number): bigint {
  return getSyncExports().rotr_u64(x, r);
}

// Integer math
export function gcdSync(a: number, b: number): number {
  return getSyncExports().gcd_u32(a, b);
}
export function gcdU64Sync(a: bigint, b: bigint): bigint {
  return getSyncExports().gcd_u64(a, b);
}

// Floating-point utilities
export function fmodSync(x: number, y: number): number {
  return getSyncExports().fmod_f64(x, y);
}
export function fmodF32Sync(x: number, y: number): number {
  return getSyncExports().fmod_f32(x, y);
}
export function copysignSync(mag: number, sgn: number): number {
  return getSyncExports().copysign_f64(mag, sgn);
}
export function copysignF32Sync(mag: number, sgn: number): number {
  return getSyncExports().copysign_f32(mag, sgn);
}
