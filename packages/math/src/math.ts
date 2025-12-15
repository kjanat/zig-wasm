/**
 * High-performance math functions implementation.
 *
 * This module contains the core implementation of math functions powered by Zig WASM.
 * It provides both async (lazy-loading) and sync (requires {@link init}) APIs.
 *
 * ## Initialization
 *
 * - **Async functions**: Auto-initialize on first call, safe to use directly
 * - **Sync functions**: Require explicit {@link init} call first, throw {@link NotInitializedError} otherwise
 *
 * The module uses a singleton pattern - initialization happens once and is shared across all calls.
 *
 * @example Using async API (recommended for most cases)
 * ```ts
 * import { sin, cos, sqrt } from "@zig-wasm/math";
 *
 * // No init needed - functions auto-initialize
 * const result = await sin(Math.PI / 2); // 1.0
 * ```
 *
 * @example Using sync API for tight loops
 * ```ts
 * import { init, sinSync, cosSync } from "@zig-wasm/math";
 *
 * await init(); // Required once before sync calls
 *
 * // Now use sync functions without await overhead
 * for (let i = 0; i < 1000; i++) {
 *   const s = sinSync(i * 0.01);
 *   const c = cosSync(i * 0.01);
 * }
 * ```
 *
 * @module math
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
 * Initialize the math module.
 *
 * This function is idempotent and concurrency-safe - multiple calls will share the same
 * initialization promise. Required before using any sync API functions.
 *
 * @param options - Optional configuration for WASM loading
 * @returns Promise that resolves when initialization is complete
 *
 * @example
 * ```ts
 * import { init, sinSync } from "@zig-wasm/math";
 *
 * await init();
 * const result = sinSync(0.5); // Now safe to use sync API
 * ```
 *
 * @example Custom WASM path
 * ```ts
 * await init({ wasmPath: "/custom/path/math.wasm" });
 * ```
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

    // v8 ignore else: -- @preserve -- browser fallback uses fetch() which doesn't support file:// URLs in Node
    if (options?.wasmBytes) {
      result = await loadWasm<MathWasmExports>({ wasmBytes: options.wasmBytes, imports: options.imports });
    } else if (options?.wasmPath) {
      result = await loadWasm<MathWasmExports>({ wasmPath: options.wasmPath, imports: options.imports });
    } else if (options?.wasmUrl) {
      result = await loadWasm<MathWasmExports>({
        wasmUrl: options.wasmUrl,
        imports: options.imports,
        fetchFn: options.fetchFn,
      });
    } else if (env.isNode || env.isBun) {
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "../wasm/math.wasm");
      result = await loadWasm<MathWasmExports>({ wasmPath });
    } else {
      const wasmUrl = new URL("../wasm/math.wasm", import.meta.url);
      result = await loadWasm<MathWasmExports>({ wasmUrl: wasmUrl.href });
    }

    wasmExports = result.exports;
  })();

  await initPromise;
}

/**
 * Check if the math module has been initialized.
 *
 * @returns `true` if {@link init} has completed successfully, `false` otherwise
 *
 * @example
 * ```ts
 * import { init, isInitialized, sinSync } from "@zig-wasm/math";
 *
 * if (!isInitialized()) {
 *   await init();
 * }
 * const result = sinSync(0.5);
 * ```
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

/**
 * Get raw WASM exports for advanced usage.
 *
 * Returns the underlying {@link MathWasmExports} interface for direct access to
 * WASM functions. Useful for advanced use cases or performance optimization.
 *
 * @returns Promise resolving to the raw WASM exports object
 */
export async function getExports(): Promise<MathWasmExports> {
  return ensureInit();
}

/**
 * Get raw WASM exports synchronously.
 *
 * @returns The raw WASM exports object
 * @throws {NotInitializedError} If {@link init} has not been called
 */
export function getExportsSync(): MathWasmExports {
  return getSyncExports();
}

// ============================================================================
// Async API - Basic operations
// ============================================================================

/**
 * Compute the absolute value of a number (f64).
 *
 * @param x - Input value
 * @returns The absolute value of x (always non-negative)
 *
 * @example
 * ```ts
 * const a = await abs(-5.5);  // 5.5
 * const b = await abs(3.14);  // 3.14
 * ```
 */
export async function abs(x: number): Promise<number> {
  return (await ensureInit()).abs_f64(x);
}

/** Compute absolute value (f32 single precision). See {@link abs}. */
export async function absF32(x: number): Promise<number> {
  return (await ensureInit()).abs_f32(x);
}

/** Compute absolute value (i32 signed integer). See {@link abs}. */
export async function absI32(x: number): Promise<number> {
  return (await ensureInit()).abs_i32(x);
}

/** Compute absolute value (i64 signed bigint). See {@link abs}. */
export async function absI64(x: bigint): Promise<bigint> {
  return (await ensureInit()).abs_i64(x);
}

/**
 * Return the smaller of two numbers (f64).
 *
 * @param a - First value
 * @param b - Second value
 * @returns The smaller of a and b
 *
 * @example
 * ```ts
 * const smaller = await min(5, 3);    // 3
 * const neg = await min(-1.5, -0.5);  // -1.5
 * ```
 */
export async function min(a: number, b: number): Promise<number> {
  return (await ensureInit()).min_f64(a, b);
}

/** Return minimum (f32 single precision). See {@link min}. */
export async function minF32(a: number, b: number): Promise<number> {
  return (await ensureInit()).min_f32(a, b);
}

/** Return minimum (i32 signed integer). See {@link min}. */
export async function minI32(a: number, b: number): Promise<number> {
  return (await ensureInit()).min_i32(a, b);
}

/** Return minimum (i64 signed bigint). See {@link min}. */
export async function minI64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).min_i64(a, b);
}

/** Return minimum (u32 unsigned integer). See {@link min}. */
export async function minU32(a: number, b: number): Promise<number> {
  return (await ensureInit()).min_u32(a, b);
}

/** Return minimum (u64 unsigned bigint). See {@link min}. */
export async function minU64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).min_u64(a, b);
}

/**
 * Return the larger of two numbers (f64).
 *
 * @param a - First value
 * @param b - Second value
 * @returns The larger of a and b
 *
 * @example
 * ```ts
 * const larger = await max(5, 3);    // 5
 * const neg = await max(-1.5, -0.5); // -0.5
 * ```
 */
export async function max(a: number, b: number): Promise<number> {
  return (await ensureInit()).max_f64(a, b);
}

/** Return maximum (f32 single precision). See {@link max}. */
export async function maxF32(a: number, b: number): Promise<number> {
  return (await ensureInit()).max_f32(a, b);
}

/** Return maximum (i32 signed integer). See {@link max}. */
export async function maxI32(a: number, b: number): Promise<number> {
  return (await ensureInit()).max_i32(a, b);
}

/** Return maximum (i64 signed bigint). See {@link max}. */
export async function maxI64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).max_i64(a, b);
}

/** Return maximum (u32 unsigned integer). See {@link max}. */
export async function maxU32(a: number, b: number): Promise<number> {
  return (await ensureInit()).max_u32(a, b);
}

/** Return maximum (u64 unsigned bigint). See {@link max}. */
export async function maxU64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).max_u64(a, b);
}

/**
 * Clamp a value to a range [lo, hi] (f64).
 *
 * Returns `lo` if `val < lo`, `hi` if `val > hi`, otherwise `val`.
 *
 * @param val - Value to clamp
 * @param lo - Minimum bound
 * @param hi - Maximum bound
 * @returns The clamped value
 *
 * @example
 * ```ts
 * const a = await clamp(150, 0, 100);  // 100
 * const b = await clamp(-5, 0, 100);   // 0
 * const c = await clamp(50, 0, 100);   // 50
 * ```
 */
export async function clamp(val: number, lo: number, hi: number): Promise<number> {
  return (await ensureInit()).clamp_f64(val, lo, hi);
}

/** Clamp value (f32 single precision). See {@link clamp}. */
export async function clampF32(val: number, lo: number, hi: number): Promise<number> {
  return (await ensureInit()).clamp_f32(val, lo, hi);
}

/** Clamp value (i32 signed integer). See {@link clamp}. */
export async function clampI32(val: number, lo: number, hi: number): Promise<number> {
  return (await ensureInit()).clamp_i32(val, lo, hi);
}

/** Clamp value (i64 signed bigint). See {@link clamp}. */
export async function clampI64(val: bigint, lo: bigint, hi: bigint): Promise<bigint> {
  return (await ensureInit()).clamp_i64(val, lo, hi);
}

/** Clamp value (u32 unsigned integer). See {@link clamp}. */
export async function clampU32(val: number, lo: number, hi: number): Promise<number> {
  return (await ensureInit()).clamp_u32(val, lo, hi);
}

/** Clamp value (u64 unsigned bigint). See {@link clamp}. */
export async function clampU64(val: bigint, lo: bigint, hi: bigint): Promise<bigint> {
  return (await ensureInit()).clamp_u64(val, lo, hi);
}

// ============================================================================
// Power and root functions
// ============================================================================

/**
 * Compute the square root of a number (f64).
 *
 * @param x - Non-negative input value
 * @returns The square root of x
 *
 * @example
 * ```ts
 * const a = await sqrt(16);  // 4
 * const b = await sqrt(2);   // ~1.414
 * ```
 */
export async function sqrt(x: number): Promise<number> {
  return (await ensureInit()).sqrt_f64(x);
}

/** Compute square root (f32 single precision). See {@link sqrt}. */
export async function sqrtF32(x: number): Promise<number> {
  return (await ensureInit()).sqrt_f32(x);
}

/**
 * Compute the cube root of a number (f64).
 *
 * @param x - Input value (can be negative)
 * @returns The cube root of x
 *
 * @example
 * ```ts
 * const a = await cbrt(27);   // 3
 * const b = await cbrt(-8);   // -2
 * ```
 */
export async function cbrt(x: number): Promise<number> {
  return (await ensureInit()).cbrt_f64(x);
}

/** Compute cube root (f32 single precision). See {@link cbrt}. */
export async function cbrtF32(x: number): Promise<number> {
  return (await ensureInit()).cbrt_f32(x);
}

/**
 * Compute base raised to the power of exp (f64).
 *
 * @param base - The base value
 * @param exp - The exponent
 * @returns base^exp
 *
 * @example
 * ```ts
 * const a = await pow(2, 10);   // 1024
 * const b = await pow(10, 3);   // 1000
 * const c = await pow(2, 0.5);  // ~1.414 (square root of 2)
 * ```
 */
export async function pow(base: number, exp: number): Promise<number> {
  return (await ensureInit()).pow_f64(base, exp);
}

/** Compute power (f32 single precision). See {@link pow}. */
export async function powF32(base: number, exp: number): Promise<number> {
  return (await ensureInit()).pow_f32(base, exp);
}

/**
 * Compute the hypotenuse: sqrt(x^2 + y^2) without overflow (f64).
 *
 * @param x - First value
 * @param y - Second value
 * @returns The Euclidean distance from origin to (x, y)
 *
 * @example
 * ```ts
 * const dist = await hypot(3, 4);  // 5 (3-4-5 triangle)
 * ```
 */
export async function hypot(x: number, y: number): Promise<number> {
  return (await ensureInit()).hypot_f64(x, y);
}

/** Compute hypotenuse (f32 single precision). See {@link hypot}. */
export async function hypotF32(x: number, y: number): Promise<number> {
  return (await ensureInit()).hypot_f32(x, y);
}

// ============================================================================
// Exponential and logarithmic functions
// ============================================================================

/**
 * Compute e^x (f64).
 *
 * @param x - Exponent value
 * @returns e raised to the power x
 *
 * @example
 * ```ts
 * const a = await exp(1);  // ~2.718 (e)
 * const b = await exp(0);  // 1
 * ```
 */
export async function exp(x: number): Promise<number> {
  return (await ensureInit()).exp_f64(x);
}

/** Compute e^x (f32 single precision). See {@link exp}. */
export async function expF32(x: number): Promise<number> {
  return (await ensureInit()).exp_f32(x);
}

/**
 * Compute 2^x (f64).
 *
 * @param x - Exponent value
 * @returns 2 raised to the power x
 */
export async function exp2(x: number): Promise<number> {
  return (await ensureInit()).exp2_f64(x);
}

/** Compute 2^x (f32 single precision). See {@link exp2}. */
export async function exp2F32(x: number): Promise<number> {
  return (await ensureInit()).exp2_f32(x);
}

/**
 * Compute e^x - 1 with better precision for small x (f64).
 *
 * @param x - Exponent value
 * @returns e^x - 1
 */
export async function expm1(x: number): Promise<number> {
  return (await ensureInit()).expm1_f64(x);
}

/** Compute e^x - 1 (f32 single precision). See {@link expm1}. */
export async function expm1F32(x: number): Promise<number> {
  return (await ensureInit()).expm1_f32(x);
}

/**
 * Compute natural logarithm (base e) of x (f64).
 *
 * @param x - Positive input value
 * @returns ln(x)
 *
 * @example
 * ```ts
 * const a = await log(Math.E);  // 1
 * const b = await log(1);       // 0
 * ```
 */
export async function log(x: number): Promise<number> {
  return (await ensureInit()).log_f64(x);
}

/** Compute natural log (f32 single precision). See {@link log}. */
export async function logF32(x: number): Promise<number> {
  return (await ensureInit()).log_f32(x);
}

/**
 * Compute base-2 logarithm of x (f64).
 *
 * @param x - Positive input value
 * @returns log2(x)
 *
 * @example
 * ```ts
 * const a = await log2(8);   // 3
 * const b = await log2(256); // 8
 * ```
 */
export async function log2(x: number): Promise<number> {
  return (await ensureInit()).log2_f64(x);
}

/** Compute log base 2 (f32 single precision). See {@link log2}. */
export async function log2F32(x: number): Promise<number> {
  return (await ensureInit()).log2_f32(x);
}

/**
 * Compute base-10 logarithm of x (f64).
 *
 * @param x - Positive input value
 * @returns log10(x)
 *
 * @example
 * ```ts
 * const a = await log10(100);  // 2
 * const b = await log10(1000); // 3
 * ```
 */
export async function log10(x: number): Promise<number> {
  return (await ensureInit()).log10_f64(x);
}

/** Compute log base 10 (f32 single precision). See {@link log10}. */
export async function log10F32(x: number): Promise<number> {
  return (await ensureInit()).log10_f32(x);
}

/**
 * Compute ln(1 + x) with better precision for small x (f64).
 *
 * @param x - Input value > -1
 * @returns ln(1 + x)
 */
export async function log1p(x: number): Promise<number> {
  return (await ensureInit()).log1p_f64(x);
}

/** Compute ln(1 + x) (f32 single precision). See {@link log1p}. */
export async function log1pF32(x: number): Promise<number> {
  return (await ensureInit()).log1p_f32(x);
}

// ============================================================================
// Trigonometric functions
// ============================================================================

/**
 * Compute the sine of an angle in radians (f64).
 *
 * @param x - Angle in radians
 * @returns The sine of x, in range [-1, 1]
 *
 * @example
 * ```ts
 * const result = await sin(Math.PI / 2); // 1.0
 * const half = await sin(Math.PI / 6);   // 0.5
 * ```
 */
export async function sin(x: number): Promise<number> {
  return (await ensureInit()).sin_f64(x);
}

/** Compute sine (f32 single precision). See {@link sin}. */
export async function sinF32(x: number): Promise<number> {
  return (await ensureInit()).sin_f32(x);
}

/**
 * Compute the cosine of an angle in radians (f64).
 *
 * @param x - Angle in radians
 * @returns The cosine of x, in range [-1, 1]
 *
 * @example
 * ```ts
 * const result = await cos(0);           // 1.0
 * const half = await cos(Math.PI / 3);   // 0.5
 * ```
 */
export async function cos(x: number): Promise<number> {
  return (await ensureInit()).cos_f64(x);
}

/** Compute cosine (f32 single precision). See {@link cos}. */
export async function cosF32(x: number): Promise<number> {
  return (await ensureInit()).cos_f32(x);
}

/**
 * Compute the tangent of an angle in radians (f64).
 *
 * @param x - Angle in radians
 * @returns The tangent of x
 */
export async function tan(x: number): Promise<number> {
  return (await ensureInit()).tan_f64(x);
}

/** Compute tangent (f32 single precision). See {@link tan}. */
export async function tanF32(x: number): Promise<number> {
  return (await ensureInit()).tan_f32(x);
}

/**
 * Compute the arc sine (inverse sine) of a value (f64).
 *
 * @param x - Value in range [-1, 1]
 * @returns Angle in radians, in range [-PI/2, PI/2]
 */
export async function asin(x: number): Promise<number> {
  return (await ensureInit()).asin_f64(x);
}

/** Compute arc sine (f32 single precision). See {@link asin}. */
export async function asinF32(x: number): Promise<number> {
  return (await ensureInit()).asin_f32(x);
}

/**
 * Compute the arc cosine (inverse cosine) of a value (f64).
 *
 * @param x - Value in range [-1, 1]
 * @returns Angle in radians, in range [0, PI]
 */
export async function acos(x: number): Promise<number> {
  return (await ensureInit()).acos_f64(x);
}

/** Compute arc cosine (f32 single precision). See {@link acos}. */
export async function acosF32(x: number): Promise<number> {
  return (await ensureInit()).acos_f32(x);
}

/**
 * Compute the arc tangent (inverse tangent) of a value (f64).
 *
 * @param x - Any numeric value
 * @returns Angle in radians, in range [-PI/2, PI/2]
 */
export async function atan(x: number): Promise<number> {
  return (await ensureInit()).atan_f64(x);
}

/** Compute arc tangent (f32 single precision). See {@link atan}. */
export async function atanF32(x: number): Promise<number> {
  return (await ensureInit()).atan_f32(x);
}

/**
 * Compute the arc tangent of y/x, using signs to determine the quadrant (f64).
 *
 * Unlike `atan(y/x)`, this function correctly handles all quadrants and edge cases.
 *
 * @param y - Y coordinate
 * @param x - X coordinate
 * @returns Angle in radians, in range [-PI, PI]
 *
 * @example
 * ```ts
 * const angle = await atan2(1, 1);   // PI/4 (45 degrees)
 * const angle2 = await atan2(-1, 1); // -PI/4
 * ```
 */
export async function atan2(y: number, x: number): Promise<number> {
  return (await ensureInit()).atan2_f64(y, x);
}

/** Compute atan2 (f32 single precision). See {@link atan2}. */
export async function atan2F32(y: number, x: number): Promise<number> {
  return (await ensureInit()).atan2_f32(y, x);
}

/**
 * Convert degrees to radians (f64).
 *
 * @param deg - Angle in degrees
 * @returns Angle in radians
 *
 * @example
 * ```ts
 * const rad = await deg2rad(180);  // ~3.14159 (PI)
 * const rad90 = await deg2rad(90); // ~1.5708 (PI/2)
 * ```
 */
export async function deg2rad(deg: number): Promise<number> {
  return (await ensureInit()).deg2rad_f64(deg);
}

/** Convert degrees to radians (f32 single precision). See {@link deg2rad}. */
export async function deg2radF32(deg: number): Promise<number> {
  return (await ensureInit()).deg2rad_f32(deg);
}

/**
 * Convert radians to degrees (f64).
 *
 * @param rad - Angle in radians
 * @returns Angle in degrees
 *
 * @example
 * ```ts
 * const deg = await rad2deg(Math.PI);     // 180
 * const deg90 = await rad2deg(Math.PI/2); // 90
 * ```
 */
export async function rad2deg(rad: number): Promise<number> {
  return (await ensureInit()).rad2deg_f64(rad);
}

/** Convert radians to degrees (f32 single precision). See {@link rad2deg}. */
export async function rad2degF32(rad: number): Promise<number> {
  return (await ensureInit()).rad2deg_f32(rad);
}

// ============================================================================
// Hyperbolic functions
// ============================================================================

/**
 * Compute the hyperbolic sine of x (f64).
 *
 * @param x - Input value
 * @returns sinh(x) = (e^x - e^-x) / 2
 */
export async function sinh(x: number): Promise<number> {
  return (await ensureInit()).sinh_f64(x);
}

/** Compute hyperbolic sine (f32 single precision). See {@link sinh}. */
export async function sinhF32(x: number): Promise<number> {
  return (await ensureInit()).sinh_f32(x);
}

/**
 * Compute the hyperbolic cosine of x (f64).
 *
 * @param x - Input value
 * @returns cosh(x) = (e^x + e^-x) / 2
 */
export async function cosh(x: number): Promise<number> {
  return (await ensureInit()).cosh_f64(x);
}

/** Compute hyperbolic cosine (f32 single precision). See {@link cosh}. */
export async function coshF32(x: number): Promise<number> {
  return (await ensureInit()).cosh_f32(x);
}

/**
 * Compute the hyperbolic tangent of x (f64).
 *
 * @param x - Input value
 * @returns tanh(x), in range (-1, 1)
 */
export async function tanh(x: number): Promise<number> {
  return (await ensureInit()).tanh_f64(x);
}

/** Compute hyperbolic tangent (f32 single precision). See {@link tanh}. */
export async function tanhF32(x: number): Promise<number> {
  return (await ensureInit()).tanh_f32(x);
}

/**
 * Compute the inverse hyperbolic sine of x (f64).
 *
 * @param x - Input value
 * @returns asinh(x)
 */
export async function asinh(x: number): Promise<number> {
  return (await ensureInit()).asinh_f64(x);
}

/** Compute inverse hyperbolic sine (f32 single precision). See {@link asinh}. */
export async function asinhF32(x: number): Promise<number> {
  return (await ensureInit()).asinh_f32(x);
}

/**
 * Compute the inverse hyperbolic cosine of x (f64).
 *
 * @param x - Input value >= 1
 * @returns acosh(x)
 */
export async function acosh(x: number): Promise<number> {
  return (await ensureInit()).acosh_f64(x);
}

/** Compute inverse hyperbolic cosine (f32 single precision). See {@link acosh}. */
export async function acoshF32(x: number): Promise<number> {
  return (await ensureInit()).acosh_f32(x);
}

/**
 * Compute the inverse hyperbolic tangent of x (f64).
 *
 * @param x - Input value in range (-1, 1)
 * @returns atanh(x)
 */
export async function atanh(x: number): Promise<number> {
  return (await ensureInit()).atanh_f64(x);
}

/** Compute inverse hyperbolic tangent (f32 single precision). See {@link atanh}. */
export async function atanhF32(x: number): Promise<number> {
  return (await ensureInit()).atanh_f32(x);
}

// ============================================================================
// Rounding functions
// ============================================================================

/**
 * Round down to the nearest integer (f64).
 *
 * @param x - Input value
 * @returns Largest integer <= x
 *
 * @example
 * ```ts
 * const a = await floor(3.7);   // 3
 * const b = await floor(-3.7);  // -4
 * ```
 */
export async function floor(x: number): Promise<number> {
  return (await ensureInit()).floor_f64(x);
}

/** Round down (f32 single precision). See {@link floor}. */
export async function floorF32(x: number): Promise<number> {
  return (await ensureInit()).floor_f32(x);
}

/**
 * Round up to the nearest integer (f64).
 *
 * @param x - Input value
 * @returns Smallest integer >= x
 *
 * @example
 * ```ts
 * const a = await ceil(3.2);   // 4
 * const b = await ceil(-3.2);  // -3
 * ```
 */
export async function ceil(x: number): Promise<number> {
  return (await ensureInit()).ceil_f64(x);
}

/** Round up (f32 single precision). See {@link ceil}. */
export async function ceilF32(x: number): Promise<number> {
  return (await ensureInit()).ceil_f32(x);
}

/**
 * Round to the nearest integer (f64).
 *
 * @param x - Input value
 * @returns Nearest integer (ties round away from zero)
 *
 * @example
 * ```ts
 * const a = await round(3.5);   // 4
 * const b = await round(3.4);   // 3
 * const c = await round(-3.5);  // -4
 * ```
 */
export async function round(x: number): Promise<number> {
  return (await ensureInit()).round_f64(x);
}

/** Round to nearest (f32 single precision). See {@link round}. */
export async function roundF32(x: number): Promise<number> {
  return (await ensureInit()).round_f32(x);
}

/**
 * Truncate toward zero (f64).
 *
 * @param x - Input value
 * @returns Integer part of x (removes fractional part)
 *
 * @example
 * ```ts
 * const a = await trunc(3.7);   // 3
 * const b = await trunc(-3.7);  // -3
 * ```
 */
export async function trunc(x: number): Promise<number> {
  return (await ensureInit()).trunc_f64(x);
}

/** Truncate (f32 single precision). See {@link trunc}. */
export async function truncF32(x: number): Promise<number> {
  return (await ensureInit()).trunc_f32(x);
}

// ============================================================================
// Classification functions
// ============================================================================

/**
 * Check if a value is NaN (f64).
 *
 * @param x - Value to check
 * @returns `true` if x is NaN
 */
export async function isNaN_(x: number): Promise<boolean> {
  return (await ensureInit()).isnan_f64(x) !== 0;
}

/** Check if NaN (f32 single precision). See {@link isNaN_}. */
export async function isNaN_F32(x: number): Promise<boolean> {
  return (await ensureInit()).isnan_f32(x) !== 0;
}

/**
 * Check if a value is infinite (f64).
 *
 * @param x - Value to check
 * @returns `true` if x is positive or negative infinity
 */
export async function isInf(x: number): Promise<boolean> {
  return (await ensureInit()).isinf_f64(x) !== 0;
}

/** Check if infinite (f32 single precision). See {@link isInf}. */
export async function isInfF32(x: number): Promise<boolean> {
  return (await ensureInit()).isinf_f32(x) !== 0;
}

/**
 * Check if a value is finite (not NaN or infinity) (f64).
 *
 * @param x - Value to check
 * @returns `true` if x is a finite number
 */
export async function isFinite_(x: number): Promise<boolean> {
  return (await ensureInit()).isfinite_f64(x) !== 0;
}

/** Check if finite (f32 single precision). See {@link isFinite_}. */
export async function isFinite_F32(x: number): Promise<boolean> {
  return (await ensureInit()).isfinite_f32(x) !== 0;
}

/**
 * Get the sign of a number (f64).
 *
 * @param x - Input value
 * @returns -1 for negative, 0 for zero, 1 for positive
 */
export async function sign(x: number): Promise<number> {
  return (await ensureInit()).sign_f64(x);
}

/** Get sign (f32 single precision). See {@link sign}. */
export async function signF32(x: number): Promise<number> {
  return (await ensureInit()).sign_f32(x);
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Get the value of PI (f64).
 *
 * @returns 3.141592653589793...
 *
 * @example
 * ```ts
 * const halfCircle = await pi();  // ~3.14159
 * const angle = halfCircle / 4;   // 45 degrees in radians
 * ```
 */
export async function pi(): Promise<number> {
  return (await ensureInit()).pi_f64();
}

/** Get PI (f32 single precision). See {@link pi}. */
export async function piF32(): Promise<number> {
  return (await ensureInit()).pi_f32();
}

/**
 * Get Euler's number e (f64).
 *
 * @returns 2.718281828459045...
 */
export async function e(): Promise<number> {
  return (await ensureInit()).e_f64();
}

/** Get e (f32 single precision). See {@link e}. */
export async function eF32(): Promise<number> {
  return (await ensureInit()).e_f32();
}

/**
 * Get the natural logarithm of 2 (f64).
 *
 * @returns ln(2) = 0.6931471805599453...
 */
export async function ln2(): Promise<number> {
  return (await ensureInit()).ln2_f64();
}

/**
 * Get the natural logarithm of 10 (f64).
 *
 * @returns ln(10) = 2.302585092994046...
 */
export async function ln10(): Promise<number> {
  return (await ensureInit()).ln10_f64();
}

// ============================================================================
// Bit manipulation
// ============================================================================

/**
 * Count leading zeros in a 32-bit unsigned integer.
 *
 * @param x - Input value (treated as u32)
 * @returns Number of leading zero bits
 *
 * @example
 * ```ts
 * const a = await clz(0b00001111);  // 28
 * const b = await clz(1);            // 31
 * const c = await clz(0);            // 32
 * ```
 */
export async function clz(x: number): Promise<number> {
  return (await ensureInit()).clz_u32(x);
}

/** Count leading zeros (u64). See {@link clz}. */
export async function clzU64(x: bigint): Promise<bigint> {
  return (await ensureInit()).clz_u64(x);
}

/**
 * Count trailing zeros in a 32-bit unsigned integer.
 *
 * @param x - Input value (treated as u32)
 * @returns Number of trailing zero bits
 *
 * @example
 * ```ts
 * const a = await ctz(0b11110000);  // 4
 * const b = await ctz(8);            // 3
 * ```
 */
export async function ctz(x: number): Promise<number> {
  return (await ensureInit()).ctz_u32(x);
}

/** Count trailing zeros (u64). See {@link ctz}. */
export async function ctzU64(x: bigint): Promise<bigint> {
  return (await ensureInit()).ctz_u64(x);
}

/**
 * Count the number of set bits (population count) in a 32-bit unsigned integer.
 *
 * @param x - Input value (treated as u32)
 * @returns Number of bits set to 1
 *
 * @example
 * ```ts
 * const a = await popcount(0b10101010);  // 4
 * const b = await popcount(0xFF);         // 8
 * ```
 */
export async function popcount(x: number): Promise<number> {
  return (await ensureInit()).popcount_u32(x);
}

/** Count set bits (u64). See {@link popcount}. */
export async function popcountU64(x: bigint): Promise<bigint> {
  return (await ensureInit()).popcount_u64(x);
}

/**
 * Byte-swap a 16-bit value (reverse byte order).
 *
 * @param x - Input value (treated as u16)
 * @returns Value with bytes reversed
 *
 * @example
 * ```ts
 * const a = await bswap16(0x1234);  // 0x3412
 * ```
 */
export async function bswap16(x: number): Promise<number> {
  return (await ensureInit()).bswap_u16(x);
}

/**
 * Byte-swap a 32-bit value (reverse byte order).
 *
 * @param x - Input value (treated as u32)
 * @returns Value with bytes reversed
 *
 * @example
 * ```ts
 * const a = await bswap32(0x12345678);  // 0x78563412
 * ```
 */
export async function bswap32(x: number): Promise<number> {
  return (await ensureInit()).bswap_u32(x);
}

/** Byte-swap (u64). See {@link bswap32}. */
export async function bswap64(x: bigint): Promise<bigint> {
  return (await ensureInit()).bswap_u64(x);
}

/**
 * Rotate bits left in a 32-bit unsigned integer.
 *
 * @param x - Value to rotate
 * @param r - Number of bit positions to rotate
 * @returns Rotated value
 *
 * @example
 * ```ts
 * const a = await rotl(0b1, 4);  // 0b10000 (16)
 * ```
 */
export async function rotl(x: number, r: number): Promise<number> {
  return (await ensureInit()).rotl_u32(x, r);
}

/** Rotate left (u64). See {@link rotl}. */
export async function rotlU64(x: bigint, r: number): Promise<bigint> {
  return (await ensureInit()).rotl_u64(x, r);
}

/**
 * Rotate bits right in a 32-bit unsigned integer.
 *
 * @param x - Value to rotate
 * @param r - Number of bit positions to rotate
 * @returns Rotated value
 */
export async function rotr(x: number, r: number): Promise<number> {
  return (await ensureInit()).rotr_u32(x, r);
}

/** Rotate right (u64). See {@link rotr}. */
export async function rotrU64(x: bigint, r: number): Promise<bigint> {
  return (await ensureInit()).rotr_u64(x, r);
}

// ============================================================================
// Integer math
// ============================================================================

/**
 * Compute the greatest common divisor of two unsigned 32-bit integers.
 *
 * **Note:** `gcd(0, 0)` is undefined in Zig's stdlib and will trap (throw).
 * At least one argument must be non-zero.
 *
 * @see {@link https://github.com/ziglang/zig/blob/0.15.2/lib/std/math/gcd.zig#L18 | Zig stdlib assertion}
 *
 * @param a - First value (at least one of a, b must be non-zero)
 * @param b - Second value (at least one of a, b must be non-zero)
 * @returns GCD of a and b
 *
 * @example
 * ```ts
 * const a = await gcd(48, 18);  // 6
 * const b = await gcd(100, 25); // 25
 * const c = await gcd(0, 5);    // 5 (one zero is fine)
 * ```
 */
export async function gcd(a: number, b: number): Promise<number> {
  return (await ensureInit()).gcd_u32(a, b);
}

/** Compute GCD (u64). See {@link gcd}. */
export async function gcdU64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).gcd_u64(a, b);
}

/**
 * Compute the least common multiple of two unsigned 32-bit integers.
 *
 * @param a - First value
 * @param b - Second value
 * @returns LCM of a and b
 *
 * @example
 * ```ts
 * const a = await lcm(4, 6);   // 12
 * const b = await lcm(21, 6);  // 42
 * ```
 */
export async function lcm(a: number, b: number): Promise<number> {
  return (await ensureInit()).lcm_u32(a, b);
}

/** Compute LCM (u64). See {@link lcm}. */
export async function lcmU64(a: bigint, b: bigint): Promise<bigint> {
  return (await ensureInit()).lcm_u64(a, b);
}

// ============================================================================
// Floating-point utilities
// ============================================================================

/**
 * Compute the floating-point remainder of x/y (f64).
 *
 * @param x - Dividend
 * @param y - Divisor
 * @returns Remainder with same sign as x
 *
 * @example
 * ```ts
 * const a = await fmod(5.3, 2);   // 1.3
 * const b = await fmod(-5.3, 2);  // -1.3
 * ```
 */
export async function fmod(x: number, y: number): Promise<number> {
  return (await ensureInit()).fmod_f64(x, y);
}

/** Compute fmod (f32 single precision). See {@link fmod}. */
export async function fmodF32(x: number, y: number): Promise<number> {
  return (await ensureInit()).fmod_f32(x, y);
}

/**
 * Copy the sign of sgn to the magnitude of mag (f64).
 *
 * @param mag - Value providing magnitude
 * @param sgn - Value providing sign
 * @returns Value with magnitude of mag and sign of sgn
 *
 * @example
 * ```ts
 * const a = await copysign(3.0, -1.0);  // -3.0
 * const b = await copysign(-3.0, 1.0);  // 3.0
 * ```
 */
export async function copysign(mag: number, sgn: number): Promise<number> {
  return (await ensureInit()).copysign_f64(mag, sgn);
}

/** Copy sign (f32 single precision). See {@link copysign}. */
export async function copysignF32(mag: number, sgn: number): Promise<number> {
  return (await ensureInit()).copysign_f32(mag, sgn);
}

/**
 * Fused multiply-add: compute x*y + z with a single rounding (f64).
 *
 * More accurate than separate multiply and add operations for numerical algorithms.
 *
 * @param x - First multiplicand
 * @param y - Second multiplicand
 * @param z - Addend
 * @returns x*y + z with single rounding
 *
 * @example
 * ```ts
 * const a = await fma(2, 3, 4);  // 10 (2*3 + 4)
 * ```
 */
export async function fma(x: number, y: number, z: number): Promise<number> {
  return (await ensureInit()).fma_f64(x, y, z);
}

/** Fused multiply-add (f32 single precision). See {@link fma}. */
export async function fmaF32(x: number, y: number, z: number): Promise<number> {
  return (await ensureInit()).fma_f32(x, y, z);
}

// ============================================================================
// Sync API - Basic operations
// ============================================================================
// Sync variants require init() to be called first. They throw NotInitializedError
// if the module is not initialized. Use for performance-critical loops.

/**
 * Compute absolute value synchronously (f64). Requires {@link init} first.
 * @throws {NotInitializedError} If module not initialized
 */
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

// Power and root - Sync variants

/** Square root synchronously (f64). Requires {@link init} first. */
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

// Exponential and logarithmic - Sync variants

/** Compute e^x synchronously (f64). Requires {@link init} first. */
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

// Trigonometric - Sync variants

/**
 * Compute sine synchronously (f64). Requires {@link init} first.
 *
 * @example
 * ```ts
 * import { init, sinSync, piSync } from "@zig-wasm/math";
 *
 * await init();
 * const result = sinSync(piSync() / 2); // 1.0
 * ```
 */
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

/** Convert degrees to radians synchronously (f64). Requires {@link init} first. */
export function deg2radSync(deg: number): number {
  return getSyncExports().deg2rad_f64(deg);
}
export function deg2radF32Sync(deg: number): number {
  return getSyncExports().deg2rad_f32(deg);
}

/** Convert radians to degrees synchronously (f64). Requires {@link init} first. */
export function rad2degSync(rad: number): number {
  return getSyncExports().rad2deg_f64(rad);
}
export function rad2degF32Sync(rad: number): number {
  return getSyncExports().rad2deg_f32(rad);
}

// Hyperbolic - Sync variants

/** Compute hyperbolic sine synchronously (f64). Requires {@link init} first. */
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

// Rounding - Sync variants

/** Round down synchronously (f64). Requires {@link init} first. */
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

// Classification - Sync variants

/** Check if NaN synchronously (f64). Requires {@link init} first. */
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

// Constants - Sync variants

/** Get PI synchronously (f64). Requires {@link init} first. */
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

// Bit manipulation - Sync variants

/** Count leading zeros synchronously (u32). Requires {@link init} first. */
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

// Integer math - Sync variants

/**
 * Compute GCD synchronously (u32). Requires {@link init} first.
 * @see {@link gcd} for details on the gcd(0, 0) limitation
 */
export function gcdSync(a: number, b: number): number {
  return getSyncExports().gcd_u32(a, b);
}
export function gcdU64Sync(a: bigint, b: bigint): bigint {
  return getSyncExports().gcd_u64(a, b);
}

/** Compute LCM synchronously (u32). Requires {@link init} first. */
export function lcmSync(a: number, b: number): number {
  return getSyncExports().lcm_u32(a, b);
}
export function lcmU64Sync(a: bigint, b: bigint): bigint {
  return getSyncExports().lcm_u64(a, b);
}

// Floating-point utilities - Sync variants

/** Compute fmod synchronously (f64). Requires {@link init} first. */
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

/** Fused multiply-add synchronously (f64). Requires {@link init} first. */
export function fmaSync(x: number, y: number, z: number): number {
  return getSyncExports().fma_f64(x, y, z);
}
export function fmaF32Sync(x: number, y: number, z: number): number {
  return getSyncExports().fma_f32(x, y, z);
}
