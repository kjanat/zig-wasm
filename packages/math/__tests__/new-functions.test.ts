/**
 * Tests for new math functions: deg2rad, rad2deg, lcm, fma
 * Uses deterministic test vectors generated from Zig's stdlib.
 */

import * as math from "@zig-wasm/math";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import testVectors from "./fixtures/test-vectors.json";

const wasmPath = join(dirname(fileURLToPath(import.meta.url)), "../wasm/math.wasm");

// Type definitions for test vectors
type FloatVectors = Record<string, number | string>; // string for "NaN", "Infinity", "-Infinity"
type IntegerVectors = Record<string, number>;

// Degree inputs matching the Zig generator
const DEGREE_INPUTS: Record<string, number> = {
  deg_0: 0,
  deg_30: 30,
  deg_45: 45,
  deg_60: 60,
  deg_90: 90,
  deg_120: 120,
  deg_135: 135,
  deg_150: 150,
  deg_180: 180,
  deg_270: 270,
  deg_360: 360,
  deg_negative_45: -45,
  deg_negative_90: -90,
  deg_negative_180: -180,
  deg_450: 450,
};

// Radian inputs matching the Zig generator (math_test_inputs)
const RADIAN_INPUTS: Record<string, number> = {
  zero: 0,
  one: 1,
  negative_one: -1,
  half: 0.5,
  negative_half: -0.5,
  pi: Math.PI,
  pi_over_2: Math.PI / 2,
  pi_over_3: Math.PI / 3,
  pi_over_4: Math.PI / 4,
  pi_over_6: Math.PI / 6,
  two_pi: Math.PI * 2,
  negative_pi: -Math.PI,
  small: 0.001,
  very_small: 1e-10,
  negative_small: -0.001,
  ten: 10,
  hundred: 100,
  negative_ten: -10,
  e: Math.E,
  two: 2,
  three: 3,
  four: 4,
  nine: 9,
  sixteen: 16,
  twenty_seven: 27,
  one_third: 1 / 3,
  two_thirds: 2 / 3,
  point_seven_five: 0.75,
  point_two_five: 0.25,
};

// Integer pairs for GCD/LCM testing
// Note: Some LCM results overflow u32, so we split into u32-safe and u64-only
const INTEGER_PAIRS_U32: Record<string, [number, number]> = {
  "12_8": [12, 8],
  "21_14": [21, 14],
  "48_18": [48, 18],
  "100_25": [100, 25],
  "0_5": [0, 5],
  "5_0": [5, 0],
  "1_1": [1, 1],
  prime_17_13: [17, 13],
  "4_6": [4, 6],
  "21_6": [21, 6],
  same_value: [42, 42],
  one_and_large: [1, 123456],
};

// These pairs have LCM that overflows u32, use u64 only
const INTEGER_PAIRS_U64_ONLY: Record<string, [bigint, bigint]> = {
  "123456_789012": [123456n, 789012n],
  large_coprime: [999983n, 999979n],
};

// FMA test cases
const FMA_CASES: Record<string, [number, number, number]> = {
  "2_3_4": [2, 3, 4],
  "1_1_1": [1, 1, 1],
  "0_5_10": [0, 5, 10],
  neg_2_3_10: [-2, 3, 10],
  half_half_quarter: [0.5, 0.5, 0.25],
  pi_2_0: [Math.PI, 2, 0],
  e_e_1: [Math.E, Math.E, 1],
  neg_neg_neg: [-1.5, -2.5, -3.5],
  large_small_med: [1e6, 1e-6, 0.5],
  precision_test: [1.0000001, 1.0000001, -1.0000002],
};

/**
 * Parse a float value from test vectors, handling special string values.
 */
function parseFloat64(value: number | string): number {
  if (typeof value === "string") {
    if (value === "NaN") return NaN;
    if (value === "Infinity") return Infinity;
    if (value === "-Infinity") return -Infinity;
    return Number.parseFloat(value);
  }
  return value;
}

describe("New Math Functions - Test Vectors", () => {
  beforeAll(async () => {
    await math.init({ wasmPath });
  });

  describe("deg2rad", () => {
    const vectors = testVectors.deg2rad as FloatVectors;

    it.each(Object.entries(DEGREE_INPUTS))("deg2rad(%s) = %d degrees", async (name, degrees) => {
      const expected = parseFloat64(vectors[name]!);
      const result = await math.deg2rad(degrees);
      expect(result).toBeCloseTo(expected, 10);
    });

    it.each(Object.entries(DEGREE_INPUTS))("deg2radSync(%s)", (name, degrees) => {
      const expected = parseFloat64(vectors[name]!);
      const result = math.deg2radSync(degrees);
      expect(result).toBeCloseTo(expected, 10);
    });

    it.each(Object.entries(DEGREE_INPUTS))("deg2radF32Sync(%s)", (name, degrees) => {
      const expected = parseFloat64(vectors[name]!);
      const result = math.deg2radF32Sync(degrees);
      // F32 has less precision
      expect(result).toBeCloseTo(expected, 5);
    });
  });

  describe("rad2deg", () => {
    const vectors = testVectors.rad2deg as FloatVectors;

    it.each(Object.entries(RADIAN_INPUTS))("rad2deg(%s)", async (name, radians) => {
      const expected = parseFloat64(vectors[name]!);
      const result = await math.rad2deg(radians);
      expect(result).toBeCloseTo(expected, 10);
    });

    it.each(Object.entries(RADIAN_INPUTS))("rad2degSync(%s)", (name, radians) => {
      const expected = parseFloat64(vectors[name]!);
      const result = math.rad2degSync(radians);
      expect(result).toBeCloseTo(expected, 10);
    });

    it.each(Object.entries(RADIAN_INPUTS))("rad2degF32Sync(%s)", (name, radians) => {
      const expected = parseFloat64(vectors[name]!);
      const result = math.rad2degF32Sync(radians);
      // F32 has less precision - use relative tolerance for large values
      const tolerance = Math.abs(expected) > 100 ? 2 : 4;
      expect(result).toBeCloseTo(expected, tolerance);
    });
  });

  describe("gcd", () => {
    const vectors = testVectors.gcd as IntegerVectors;

    // Test u32 pairs
    it.each(Object.entries(INTEGER_PAIRS_U32))("gcd(%s)", async (name, [a, b]) => {
      const expected = vectors[name]!;
      const result = await math.gcd(a, b);
      expect(result).toBe(expected);
    });

    it.each(Object.entries(INTEGER_PAIRS_U32))("gcdSync(%s)", (name, [a, b]) => {
      const expected = vectors[name]!;
      const result = math.gcdSync(a, b);
      expect(result).toBe(expected);
    });

    // Test u64 pairs (including those that overflow u32 for LCM)
    it.each(Object.entries(INTEGER_PAIRS_U64_ONLY))("gcdU64Sync(%s)", (name, [a, b]) => {
      const expected = BigInt(vectors[name]!);
      const result = math.gcdU64Sync(a, b);
      expect(result).toBe(expected);
    });

    // Test the documented limitation: gcd(0, 0) traps
    it("traps on gcd(0, 0)", () => {
      expect(() => math.gcdSync(0, 0)).toThrow();
    });
  });

  describe("lcm", () => {
    const vectors = testVectors.lcm as IntegerVectors;

    // Test u32 pairs (results fit in u32)
    it.each(Object.entries(INTEGER_PAIRS_U32))("lcm(%s)", async (name, [a, b]) => {
      const expected = vectors[name]!;
      const result = await math.lcm(a, b);
      expect(result).toBe(expected);
    });

    it.each(Object.entries(INTEGER_PAIRS_U32))("lcmSync(%s)", (name, [a, b]) => {
      const expected = vectors[name]!;
      const result = math.lcmSync(a, b);
      expect(result).toBe(expected);
    });

    // Test u64 pairs (results overflow u32)
    it.each(Object.entries(INTEGER_PAIRS_U64_ONLY))("lcmU64Sync(%s)", (name, [a, b]) => {
      const expected = BigInt(vectors[name]!);
      const result = math.lcmU64Sync(a, b);
      expect(result).toBe(expected);
    });
  });

  describe("fma", () => {
    const vectors = testVectors.fma as FloatVectors;

    it.each(Object.entries(FMA_CASES))("fma(%s)", async (name, [x, y, z]) => {
      const expected = parseFloat64(vectors[name]!);
      const result = await math.fma(x, y, z);
      expect(result).toBeCloseTo(expected, 10);
    });

    it.each(Object.entries(FMA_CASES))("fmaSync(%s)", (name, [x, y, z]) => {
      const expected = parseFloat64(vectors[name]!);
      const result = math.fmaSync(x, y, z);
      expect(result).toBeCloseTo(expected, 10);
    });

    it.each(Object.entries(FMA_CASES))("fmaF32Sync(%s)", (name, [x, y, z]) => {
      const expected = parseFloat64(vectors[name]!);
      const result = math.fmaF32Sync(x, y, z);
      // F32 has less precision
      expect(result).toBeCloseTo(expected, 5);
    });
  });
});

describe("Angle Conversion Round-trips", () => {
  beforeAll(async () => {
    await math.init({ wasmPath });
  });

  it("deg2rad -> rad2deg round-trip", async () => {
    const degrees = [0, 30, 45, 60, 90, 180, 270, 360, -45, -90];
    for (const deg of degrees) {
      const rad = await math.deg2rad(deg);
      const back = await math.rad2deg(rad);
      expect(back).toBeCloseTo(deg, 10);
    }
  });

  it("rad2deg -> deg2rad round-trip", async () => {
    const radians = [0, Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI];
    for (const rad of radians) {
      const deg = await math.rad2deg(rad);
      const back = await math.deg2rad(deg);
      expect(back).toBeCloseTo(rad, 10);
    }
  });
});

describe("GCD/LCM Mathematical Properties", () => {
  beforeAll(async () => {
    await math.init({ wasmPath });
  });

  it("gcd(a, b) * lcm(a, b) = a * b (for non-zero)", () => {
    const pairs: [number, number][] = [
      [12, 8],
      [21, 14],
      [48, 18],
      [100, 25],
      [17, 13],
    ];
    for (const [a, b] of pairs) {
      const g = math.gcdSync(a, b);
      const l = math.lcmSync(a, b);
      expect(g * l).toBe(a * b);
    }
  });

  it("gcd is commutative", () => {
    expect(math.gcdSync(12, 8)).toBe(math.gcdSync(8, 12));
    expect(math.gcdSync(48, 18)).toBe(math.gcdSync(18, 48));
  });

  it("lcm is commutative", () => {
    expect(math.lcmSync(12, 8)).toBe(math.lcmSync(8, 12));
    expect(math.lcmSync(48, 18)).toBe(math.lcmSync(18, 48));
  });

  it("gcd(a, 0) = a", () => {
    expect(math.gcdSync(5, 0)).toBe(5);
    expect(math.gcdSync(0, 5)).toBe(5);
    expect(math.gcdSync(123, 0)).toBe(123);
  });

  it("lcm(a, 0) = 0", () => {
    expect(math.lcmSync(5, 0)).toBe(0);
    expect(math.lcmSync(0, 5)).toBe(0);
  });
});

describe("FMA Properties", () => {
  beforeAll(async () => {
    await math.init({ wasmPath });
  });

  it("fma(a, b, 0) = a * b", () => {
    expect(math.fmaSync(3, 4, 0)).toBeCloseTo(12, 10);
    expect(math.fmaSync(2.5, 4, 0)).toBeCloseTo(10, 10);
  });

  it("fma(a, 1, b) = a + b", () => {
    expect(math.fmaSync(3, 1, 4)).toBeCloseTo(7, 10);
    expect(math.fmaSync(2.5, 1, 1.5)).toBeCloseTo(4, 10);
  });

  it("fma(a, 0, b) = b", () => {
    expect(math.fmaSync(999, 0, 42)).toBeCloseTo(42, 10);
  });
});
