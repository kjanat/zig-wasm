/**
 * Mathematical functions via Zig WebAssembly.
 *
 * This module provides mathematical operations including:
 * trigonometric (sin, cos, tan, etc.), exponential/logarithmic (exp, log, pow),
 * rounding (floor, ceil, round, trunc), and bit manipulation functions.
 *
 * This is a subpath re-export of {@link https://jsr.io/@zig-wasm/math | @zig-wasm/math}.
 * For the smallest bundle size, import directly from `@zig-wasm/math`.
 *
 * @example Trigonometric functions
 * ```ts
 * import { sin, cos, tan, atan2 } from "@zig-wasm/std/math";
 *
 * const angle = Math.PI / 4;
 * console.log(sin(angle)); // ~0.707
 * console.log(cos(angle)); // ~0.707
 * console.log(tan(angle)); // ~1.0
 * ```
 *
 * @example Exponential and logarithmic
 * ```ts
 * import { exp, log, log2, pow, sqrt } from "@zig-wasm/std/math";
 *
 * console.log(exp(1));    // ~2.718 (e^1)
 * console.log(log(10));   // ~2.303 (natural log)
 * console.log(pow(2, 8)); // 256
 * console.log(sqrt(16));  // 4
 * ```
 *
 * @example Rounding and clamping
 * ```ts
 * import { floor, ceil, round, clamp } from "@zig-wasm/std/math";
 *
 * console.log(floor(3.7));  // 3
 * console.log(ceil(3.2));   // 4
 * console.log(round(3.5));  // 4
 * console.log(clamp(5, 0, 3)); // 3 (clamp 5 to range [0,3])
 * ```
 *
 * @example Bit operations
 * ```ts
 * import { clz, ctz, popCount } from "@zig-wasm/std/math";
 *
 * // Count leading zeros, trailing zeros, and set bits
 * console.log(clz(8));      // Count leading zeros
 * console.log(popCount(7)); // 3 (binary 111 has 3 set bits)
 * ```
 *
 * @module math
 */
export * from "@zig-wasm/math";
