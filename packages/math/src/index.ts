/**
 * @zig-wasm/math
 *
 * High-performance math functions powered by Zig via WebAssembly
 */

// Types
export type { MathWasmExports } from "./types.js";

// Basic operations
export {
  abs,
  absF32,
  absI32,
  absI64,
  clamp,
  clampF32,
  clampI32,
  clampI64,
  clampU32,
  clampU64,
  max,
  maxF32,
  maxI32,
  maxI64,
  maxU32,
  maxU64,
  min,
  minF32,
  minI32,
  minI64,
  minU32,
  minU64,
} from "./math.js";

// Power and root functions
export { cbrt, cbrtF32, hypot, hypotF32, pow, powF32, sqrt, sqrtF32 } from "./math.js";

// Exponential and logarithmic functions
export {
  exp,
  exp2,
  exp2F32,
  expF32,
  expm1,
  expm1F32,
  log,
  log10,
  log10F32,
  log1p,
  log1pF32,
  log2,
  log2F32,
  logF32,
} from "./math.js";

// Trigonometric functions
export {
  acos,
  acosF32,
  asin,
  asinF32,
  atan,
  atan2,
  atan2F32,
  atanF32,
  cos,
  cosF32,
  sin,
  sinF32,
  tan,
  tanF32,
} from "./math.js";

// Hyperbolic functions
export {
  acosh,
  acoshF32,
  asinh,
  asinhF32,
  atanh,
  atanhF32,
  cosh,
  coshF32,
  sinh,
  sinhF32,
  tanh,
  tanhF32,
} from "./math.js";

// Rounding functions
export { ceil, ceilF32, floor, floorF32, round, roundF32, trunc, truncF32 } from "./math.js";

// Classification functions
export {
  isFinite_ as isFinite,
  isFinite_F32 as isFiniteF32,
  isInf,
  isInfF32,
  isNaN_ as isNaN,
  isNaN_F32 as isNaNF32,
  sign,
  signF32,
} from "./math.js";

// Constants
export { e, eF32, ln10, ln2, pi, piF32 } from "./math.js";

// Bit manipulation
export {
  bswap16,
  bswap32,
  bswap64,
  clz,
  clzU64,
  ctz,
  ctzU64,
  popcount,
  popcountU64,
  rotl,
  rotlU64,
  rotr,
  rotrU64,
} from "./math.js";

// Integer math
export { gcd, gcdU64 } from "./math.js";

// Floating-point utilities
export { copysign, copysignF32, fmod, fmodF32 } from "./math.js";

// Raw exports access
export { getExports } from "./math.js";
