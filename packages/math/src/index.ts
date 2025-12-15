/**
 * High-performance math functions powered by Zig via WebAssembly.
 *
 * This module provides a comprehensive set of mathematical operations implemented
 * in Zig and compiled to WebAssembly for near-native performance in JavaScript/TypeScript.
 *
 * ## Function Categories
 *
 * - **Trigonometric**: {@link sin}, {@link cos}, {@link tan}, {@link asin}, {@link acos}, {@link atan}, {@link atan2}
 * - **Hyperbolic**: {@link sinh}, {@link cosh}, {@link tanh}, {@link asinh}, {@link acosh}, {@link atanh}
 * - **Exponential/Logarithmic**: {@link exp}, {@link exp2}, {@link log}, {@link log2}, {@link log10}, {@link pow}
 * - **Rounding**: {@link floor}, {@link ceil}, {@link round}, {@link trunc}
 * - **Bit Manipulation**: {@link clz}, {@link ctz}, {@link popcount}, {@link bswap16}, {@link rotl}, {@link rotr}
 * - **Utilities**: {@link abs}, {@link min}, {@link max}, {@link clamp}, {@link sqrt}, {@link cbrt}, {@link hypot}
 * - **Constants**: {@link pi}, {@link e}, {@link ln2}, {@link ln10}
 * - **Classification**: {@link isNaN}, {@link isInf}, {@link isFinite}, {@link sign}
 *
 * ## Precision Variants
 *
 * Most functions have F32 variants (e.g., {@link sinF32}, {@link sqrtF32}) for single-precision
 * (32-bit) floating-point operations. The default functions use f64 (64-bit double precision).
 * Integer variants (I32, I64, U32, U64) are available where applicable.
 *
 * ## API Styles
 *
 * - **Async API**: Functions like {@link sin}, {@link cos} auto-initialize the WASM module on first call
 * - **Sync API**: Functions like {@link sinSync}, {@link cosSync} require explicit {@link init} call first
 *
 * @example Basic trigonometry (async)
 * ```ts
 * import { sin, cos, sqrt, clamp, pi } from "@zig-wasm/math";
 *
 * // Trigonometry - async API auto-initializes
 * const angle = await pi() / 4;
 * const sinVal = await sin(angle);  // ~0.707
 * const cosVal = await cos(angle);  // ~0.707
 *
 * // Clamping values to a range
 * const clamped = await clamp(150, 0, 100); // 100
 *
 * // Square root
 * const root = await sqrt(16); // 4
 * ```
 *
 * @example Sync API for performance-critical code
 * ```ts
 * import { init, sinSync, cosSync, sqrtSync, piSync } from "@zig-wasm/math";
 *
 * // Must initialize before using sync functions
 * await init();
 *
 * // Now sync functions work without await overhead
 * const angle = piSync() / 4;
 * const sinVal = sinSync(angle);
 * const cosVal = cosSync(angle);
 * ```
 *
 * @example Single-precision (F32) variants
 * ```ts
 * import { sinF32, sqrtF32, piF32 } from "@zig-wasm/math";
 *
 * // F32 variants for single-precision when memory/speed matters
 * const angle = await piF32() / 4;
 * const result = await sinF32(angle);
 * ```
 *
 * @example Bit manipulation
 * ```ts
 * import { clz, popcount, bswap32, rotl } from "@zig-wasm/math";
 *
 * const leadingZeros = await clz(0b00001111);  // 28
 * const setBits = await popcount(0b10101010);  // 4
 * const swapped = await bswap32(0x12345678);   // 0x78563412
 * const rotated = await rotl(0b1, 4);          // 0b10000
 * ```
 *
 * @module
 */

// Lifecycle
export { getExports, getExportsSync, init, isInitialized } from "./math.ts";

// Async API
// dprint-ignore
export { abs, absF32, absI32, absI64, acos, acosF32, acosh, acoshF32, asin,
  asinF32, asinh, asinhF32, atan, atan2, atan2F32, atanF32, atanh, atanhF32,
  bswap16, bswap32, bswap64, cbrt, cbrtF32, ceil, ceilF32, clamp, clampF32,
  clampI32, clampI64, clampU32, clampU64, clz, clzU64, copysign, copysignF32,
  cos, cosF32, cosh, coshF32, ctz, ctzU64, deg2rad, deg2radF32, e, eF32, exp,
  exp2, exp2F32, expF32, expm1, expm1F32, floor, floorF32, fma, fmaF32, fmod,
  fmodF32, gcd, gcdU64, hypot, hypotF32, isFinite_ as isFinite,
  isFinite_F32 as isFiniteF32, isInf, isInfF32, isNaN_ as isNaN,
  isNaN_F32 as isNaNF32, lcm, lcmU64, ln10, ln2, log, log10, log10F32, log1p,
  log1pF32, log2, log2F32, logF32, max, maxF32, maxI32, maxI64, maxU32, maxU64,
  min, minF32, minI32, minI64, minU32, minU64, pi, piF32, popcount, popcountU64,
  pow, powF32, rad2deg, rad2degF32, rotl, rotlU64, rotr, rotrU64, round,
  roundF32, sign, signF32, sin, sinF32, sinh, sinhF32, sqrt, sqrtF32, tan,
  tanF32, tanh, tanhF32, trunc, truncF32,
} from "./math.ts";

// Sync API
// dprint-ignore
export {
  absF32Sync, absI32Sync, absI64Sync, absSync, acosF32Sync, acoshF32Sync,
  acoshSync, acosSync, asinF32Sync, asinhF32Sync, asinhSync, asinSync,
  atan2F32Sync, atan2Sync, atanF32Sync, atanhF32Sync, atanhSync, atanSync,
  bswap16Sync, bswap32Sync, bswap64Sync, cbrtF32Sync, cbrtSync, ceilF32Sync,
  ceilSync, clampF32Sync, clampI32Sync, clampI64Sync, clampSync, clampU32Sync,
  clampU64Sync, clzSync, clzU64Sync, copysignF32Sync, copysignSync, cosF32Sync,
  coshF32Sync, coshSync, cosSync, ctzSync, ctzU64Sync, deg2radF32Sync,
  deg2radSync, eF32Sync, eSync, exp2F32Sync, exp2Sync, expF32Sync, expm1F32Sync,
  expm1Sync, expSync, floorF32Sync, floorSync, fmaF32Sync, fmaSync, fmodF32Sync,
  fmodSync, gcdSync, gcdU64Sync, hypotF32Sync, hypotSync,
  isFinite_F32Sync as isFiniteF32Sync, isFinite_Sync as isFiniteSync,
  isInfF32Sync, isInfSync, isNaN_F32Sync as isNaNF32Sync,
  isNaN_Sync as isNaNSync, lcmSync, lcmU64Sync, ln10Sync, ln2Sync, log10F32Sync,
  log10Sync, log1pF32Sync, log1pSync, log2F32Sync, log2Sync, logF32Sync,
  logSync, maxF32Sync, maxI32Sync, maxI64Sync, maxSync, maxU32Sync, maxU64Sync,
  minF32Sync, minI32Sync, minI64Sync, minSync, minU32Sync, minU64Sync,
  piF32Sync, piSync, popcountSync, popcountU64Sync, powF32Sync, powSync,
  rad2degF32Sync, rad2degSync, rotlSync, rotlU64Sync, rotrSync, rotrU64Sync,
  roundF32Sync, roundSync, signF32Sync, signSync, sinF32Sync, sinhF32Sync,
  sinhSync, sinSync, sqrtF32Sync, sqrtSync, tanF32Sync, tanhF32Sync, tanhSync,
  tanSync, truncF32Sync, truncSync,
} from "./math.ts";

// Types
export type { MathWasmExports } from "./types.ts";

// Re-export error for convenience
export { NotInitializedError } from "@zig-wasm/core";
export type { InitOptions } from "@zig-wasm/core";
