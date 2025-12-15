/**
 * Tests for sync API variants to ensure complete coverage
 * Focuses on F32, U64, and less commonly used sync functions
 */

import * as math from "@zig-wasm/math";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
  await math.init();
});

describe("Sync F32 Variants", () => {
  describe("classification functions (F32)", () => {
    it("isNaNF32Sync detects NaN", () => {
      expect(math.isNaNF32Sync(NaN)).toBe(true);
      expect(math.isNaNF32Sync(0)).toBe(false);
      expect(math.isNaNF32Sync(42.5)).toBe(false);
      expect(math.isNaNF32Sync(Infinity)).toBe(false);
    });

    it("isInfF32Sync detects infinity", () => {
      expect(math.isInfF32Sync(Infinity)).toBe(true);
      expect(math.isInfF32Sync(-Infinity)).toBe(true);
      expect(math.isInfF32Sync(0)).toBe(false);
      expect(math.isInfF32Sync(NaN)).toBe(false);
      expect(math.isInfF32Sync(1e38)).toBe(false);
    });

    it("isFiniteF32Sync detects finite values", () => {
      expect(math.isFiniteF32Sync(0)).toBe(true);
      expect(math.isFiniteF32Sync(42.5)).toBe(true);
      expect(math.isFiniteF32Sync(-1e38)).toBe(true);
      expect(math.isFiniteF32Sync(Infinity)).toBe(false);
      expect(math.isFiniteF32Sync(-Infinity)).toBe(false);
      expect(math.isFiniteF32Sync(NaN)).toBe(false);
    });

    it("signF32Sync returns correct sign", () => {
      expect(math.signF32Sync(42.5)).toBe(1);
      expect(math.signF32Sync(-42.5)).toBe(-1);
      expect(math.signF32Sync(0)).toBe(0);
    });
  });

  describe("constants (F32)", () => {
    it("piF32Sync returns pi with f32 precision", () => {
      expect(math.piF32Sync()).toBeCloseTo(Math.PI, 6);
    });

    it("eF32Sync returns e with f32 precision", () => {
      expect(math.eF32Sync()).toBeCloseTo(Math.E, 6);
    });
  });

  describe("floating-point utilities (F32)", () => {
    it("fmodF32Sync computes remainder", () => {
      expect(math.fmodF32Sync(5.5, 2.0)).toBeCloseTo(1.5, 5);
      expect(math.fmodF32Sync(10.0, 3.0)).toBeCloseTo(1.0, 5);
      expect(math.fmodF32Sync(7.5, 2.5)).toBeCloseTo(0, 5);
    });

    it("copysignF32Sync copies sign", () => {
      expect(math.copysignF32Sync(5.0, 1.0)).toBe(5.0);
      expect(math.copysignF32Sync(5.0, -1.0)).toBe(-5.0);
      expect(math.copysignF32Sync(-5.0, 1.0)).toBe(5.0);
      expect(math.copysignF32Sync(-5.0, -1.0)).toBe(-5.0);
    });
  });

  describe("min/max (F32)", () => {
    it("minF32Sync finds minimum", () => {
      expect(math.minF32Sync(5.5, 10.5)).toBeCloseTo(5.5, 5);
      expect(math.minF32Sync(-5.5, -10.5)).toBeCloseTo(-10.5, 5);
    });

    it("maxF32Sync finds maximum", () => {
      expect(math.maxF32Sync(5.5, 10.5)).toBeCloseTo(10.5, 5);
      expect(math.maxF32Sync(-5.5, -10.5)).toBeCloseTo(-5.5, 5);
    });
  });

  describe("clamp (F32)", () => {
    it("clampF32Sync clamps values", () => {
      expect(math.clampF32Sync(5.0, 0.0, 10.0)).toBeCloseTo(5.0, 5);
      expect(math.clampF32Sync(-5.0, 0.0, 10.0)).toBeCloseTo(0.0, 5);
      expect(math.clampF32Sync(15.0, 0.0, 10.0)).toBeCloseTo(10.0, 5);
    });
  });

  describe("trigonometric (F32)", () => {
    it("sinF32Sync computes sine", () => {
      expect(math.sinF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.sinF32Sync(Math.PI / 2)).toBeCloseTo(1, 5);
    });

    it("cosF32Sync computes cosine", () => {
      expect(math.cosF32Sync(0)).toBeCloseTo(1, 5);
      expect(math.cosF32Sync(Math.PI)).toBeCloseTo(-1, 5);
    });

    it("tanF32Sync computes tangent", () => {
      expect(math.tanF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.tanF32Sync(Math.PI / 4)).toBeCloseTo(1, 5);
    });

    it("asinF32Sync computes arcsine", () => {
      expect(math.asinF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.asinF32Sync(1)).toBeCloseTo(Math.PI / 2, 5);
    });

    it("acosF32Sync computes arccosine", () => {
      expect(math.acosF32Sync(1)).toBeCloseTo(0, 5);
      expect(math.acosF32Sync(0)).toBeCloseTo(Math.PI / 2, 5);
    });

    it("atanF32Sync computes arctangent", () => {
      expect(math.atanF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.atanF32Sync(1)).toBeCloseTo(Math.PI / 4, 5);
    });

    it("atan2F32Sync computes two-argument arctangent", () => {
      expect(math.atan2F32Sync(0, 1)).toBeCloseTo(0, 5);
      expect(math.atan2F32Sync(1, 0)).toBeCloseTo(Math.PI / 2, 5);
    });
  });

  describe("hyperbolic (F32)", () => {
    it("sinhF32Sync computes hyperbolic sine", () => {
      expect(math.sinhF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.sinhF32Sync(1)).toBeCloseTo(1.175201, 4);
    });

    it("coshF32Sync computes hyperbolic cosine", () => {
      expect(math.coshF32Sync(0)).toBeCloseTo(1, 5);
      expect(math.coshF32Sync(1)).toBeCloseTo(1.543081, 4);
    });

    it("tanhF32Sync computes hyperbolic tangent", () => {
      expect(math.tanhF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.tanhF32Sync(1)).toBeCloseTo(0.761594, 4);
    });

    it("asinhF32Sync computes inverse hyperbolic sine", () => {
      expect(math.asinhF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.asinhF32Sync(1)).toBeCloseTo(0.881373, 4);
    });

    it("acoshF32Sync computes inverse hyperbolic cosine", () => {
      expect(math.acoshF32Sync(1)).toBeCloseTo(0, 5);
      expect(math.acoshF32Sync(2)).toBeCloseTo(1.316958, 4);
    });

    it("atanhF32Sync computes inverse hyperbolic tangent", () => {
      expect(math.atanhF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.atanhF32Sync(0.5)).toBeCloseTo(0.549306, 4);
    });
  });

  describe("exponential and logarithmic (F32)", () => {
    it("expF32Sync computes e^x", () => {
      expect(math.expF32Sync(0)).toBeCloseTo(1, 5);
      expect(math.expF32Sync(1)).toBeCloseTo(Math.E, 5);
    });

    it("exp2F32Sync computes 2^x", () => {
      expect(math.exp2F32Sync(0)).toBeCloseTo(1, 5);
      expect(math.exp2F32Sync(10)).toBeCloseTo(1024, 5);
    });

    it("expm1F32Sync computes e^x - 1", () => {
      expect(math.expm1F32Sync(0)).toBeCloseTo(0, 5);
      expect(math.expm1F32Sync(1)).toBeCloseTo(Math.E - 1, 4);
    });

    it("logF32Sync computes natural log", () => {
      expect(math.logF32Sync(1)).toBeCloseTo(0, 5);
      expect(math.logF32Sync(Math.E)).toBeCloseTo(1, 5);
    });

    it("log2F32Sync computes base-2 log", () => {
      expect(math.log2F32Sync(1)).toBeCloseTo(0, 5);
      expect(math.log2F32Sync(1024)).toBeCloseTo(10, 5);
    });

    it("log10F32Sync computes base-10 log", () => {
      expect(math.log10F32Sync(1)).toBeCloseTo(0, 5);
      expect(math.log10F32Sync(100)).toBeCloseTo(2, 5);
    });

    it("log1pF32Sync computes log(1+x)", () => {
      expect(math.log1pF32Sync(0)).toBeCloseTo(0, 5);
      expect(math.log1pF32Sync(Math.E - 1)).toBeCloseTo(1, 4);
    });
  });

  describe("power and root (F32)", () => {
    it("sqrtF32Sync computes square root", () => {
      expect(math.sqrtF32Sync(4)).toBeCloseTo(2, 5);
      expect(math.sqrtF32Sync(9)).toBeCloseTo(3, 5);
    });

    it("cbrtF32Sync computes cube root", () => {
      expect(math.cbrtF32Sync(8)).toBeCloseTo(2, 5);
      expect(math.cbrtF32Sync(27)).toBeCloseTo(3, 5);
    });

    it("powF32Sync computes power", () => {
      expect(math.powF32Sync(2, 3)).toBeCloseTo(8, 5);
      expect(math.powF32Sync(5, 2)).toBeCloseTo(25, 5);
    });

    it("hypotF32Sync computes hypotenuse", () => {
      expect(math.hypotF32Sync(3, 4)).toBeCloseTo(5, 5);
      expect(math.hypotF32Sync(5, 12)).toBeCloseTo(13, 5);
    });
  });

  describe("rounding (F32)", () => {
    it("floorF32Sync rounds down", () => {
      expect(math.floorF32Sync(3.7)).toBe(3);
      expect(math.floorF32Sync(-3.2)).toBe(-4);
    });

    it("ceilF32Sync rounds up", () => {
      expect(math.ceilF32Sync(3.2)).toBe(4);
      expect(math.ceilF32Sync(-3.7)).toBe(-3);
    });

    it("roundF32Sync rounds to nearest", () => {
      expect(math.roundF32Sync(3.4)).toBe(3);
      expect(math.roundF32Sync(3.5)).toBe(4);
    });

    it("truncF32Sync truncates toward zero", () => {
      expect(math.truncF32Sync(3.7)).toBe(3);
      expect(math.truncF32Sync(-3.7)).toBe(-3);
    });
  });

  describe("abs (F32 and integers)", () => {
    it("absF32Sync computes absolute value", () => {
      expect(math.absF32Sync(-42.5)).toBeCloseTo(42.5, 5);
      expect(math.absF32Sync(42.5)).toBeCloseTo(42.5, 5);
    });

    it("absI32Sync computes absolute value", () => {
      expect(math.absI32Sync(-100)).toBe(100);
      expect(math.absI32Sync(100)).toBe(100);
    });

    it("absI64Sync computes absolute value", () => {
      expect(math.absI64Sync(-9223372036854775807n)).toBe(9223372036854775807n);
    });
  });
});

describe("Sync U64/I64 Variants", () => {
  describe("bit manipulation (U64)", () => {
    it("clzU64Sync counts leading zeros", () => {
      expect(math.clzU64Sync(1n)).toBe(63n);
      expect(math.clzU64Sync(0xFFFFFFFFFFFFFFFFn)).toBe(0n);
      expect(math.clzU64Sync(0n)).toBe(64n);
    });

    it("ctzU64Sync counts trailing zeros", () => {
      expect(math.ctzU64Sync(8n)).toBe(3n);
      expect(math.ctzU64Sync(1n)).toBe(0n);
      expect(math.ctzU64Sync(0n)).toBe(64n);
    });

    it("popcountU64Sync counts set bits", () => {
      expect(math.popcountU64Sync(0xFFFFFFFFFFFFFFFFn)).toBe(64n);
      expect(math.popcountU64Sync(0n)).toBe(0n);
      expect(math.popcountU64Sync(0b10101010n)).toBe(4n);
    });

    it("bswap64Sync swaps bytes", () => {
      expect(math.bswap64Sync(0x0011223344556677n)).toBe(0x7766554433221100n);
      expect(math.bswap64Sync(0x0102030405060708n)).toBe(0x0807060504030201n);
    });

    it("rotlU64Sync rotates left", () => {
      // Rotation amount is number, not bigint (WASM uses i32 for shift)
      expect(math.rotlU64Sync(1n, 1)).toBe(2n);
      // WASM returns signed i64, use BigInt.asUintN for unsigned comparison
      expect(BigInt.asUintN(64, math.rotlU64Sync(1n, 63))).toBe(0x8000000000000000n);
      expect(BigInt.asUintN(64, math.rotlU64Sync(BigInt.asIntN(64, 0x8000000000000000n), 1))).toBe(1n);
    });

    it("rotrU64Sync rotates right", () => {
      // Rotation amount is number, not bigint (WASM uses i32 for shift)
      expect(math.rotrU64Sync(2n, 1)).toBe(1n);
      // WASM returns signed i64, use BigInt.asUintN for unsigned comparison
      expect(BigInt.asUintN(64, math.rotrU64Sync(1n, 1))).toBe(0x8000000000000000n);
      expect(BigInt.asUintN(64, math.rotrU64Sync(BigInt.asIntN(64, 0x8000000000000000n), 63))).toBe(1n);
    });
  });

  describe("integer math (U64)", () => {
    it("gcdU64Sync computes GCD", () => {
      expect(math.gcdU64Sync(12n, 8n)).toBe(4n);
      expect(math.gcdU64Sync(21n, 14n)).toBe(7n);
      expect(math.gcdU64Sync(123456n, 789012n)).toBe(12n);
      expect(math.gcdU64Sync(0n, 5n)).toBe(5n);
    });
  });

  describe("min/max (I64)", () => {
    it("minI64Sync finds minimum", () => {
      expect(math.minI64Sync(-999n, 999n)).toBe(-999n);
      expect(math.minI64Sync(100n, 200n)).toBe(100n);
    });

    it("maxI64Sync finds maximum", () => {
      expect(math.maxI64Sync(-999n, 999n)).toBe(999n);
      expect(math.maxI64Sync(100n, 200n)).toBe(200n);
    });
  });

  describe("min/max (I32)", () => {
    it("minI32Sync finds minimum", () => {
      expect(math.minI32Sync(-100, 100)).toBe(-100);
      expect(math.minI32Sync(50, 75)).toBe(50);
    });

    it("maxI32Sync finds maximum", () => {
      expect(math.maxI32Sync(-100, 100)).toBe(100);
      expect(math.maxI32Sync(50, 75)).toBe(75);
    });
  });

  describe("clamp (I32)", () => {
    it("clampI32Sync clamps values", () => {
      expect(math.clampI32Sync(5, -10, 10)).toBe(5);
      expect(math.clampI32Sync(-100, -10, 10)).toBe(-10);
      expect(math.clampI32Sync(100, -10, 10)).toBe(10);
    });
  });

  describe("min/max (U32)", () => {
    it("minU32Sync finds minimum of unsigned 32-bit integers", () => {
      expect(math.minU32Sync(5, 10)).toBe(5);
      expect(math.minU32Sync(0, 100)).toBe(0);
      expect(math.minU32Sync(0xFFFFFFFF >>> 0, 1)).toBe(1);
    });

    it("maxU32Sync finds maximum of unsigned 32-bit integers", () => {
      expect(math.maxU32Sync(5, 10)).toBe(10);
      expect(math.maxU32Sync(0, 100)).toBe(100);
      expect(math.maxU32Sync(0xFFFFFFFF >>> 0, 1) >>> 0).toBe(0xFFFFFFFF >>> 0);
    });
  });

  describe("min/max (U64)", () => {
    it("minU64Sync finds minimum of unsigned 64-bit integers", () => {
      expect(math.minU64Sync(5n, 10n)).toBe(5n);
      expect(math.minU64Sync(0n, 100n)).toBe(0n);
      expect(math.minU64Sync(0xFFFFFFFFFFFFFFFFn, 1n)).toBe(1n);
    });

    it("maxU64Sync finds maximum of unsigned 64-bit integers", () => {
      expect(math.maxU64Sync(5n, 10n)).toBe(10n);
      expect(math.maxU64Sync(0n, 100n)).toBe(100n);
      expect(BigInt.asUintN(64, math.maxU64Sync(0xFFFFFFFFFFFFFFFFn, 1n))).toBe(0xFFFFFFFFFFFFFFFFn);
    });
  });

  describe("clamp (I64)", () => {
    it("clampI64Sync clamps signed 64-bit integers", () => {
      expect(math.clampI64Sync(5n, -10n, 10n)).toBe(5n);
      expect(math.clampI64Sync(-100n, -10n, 10n)).toBe(-10n);
      expect(math.clampI64Sync(100n, -10n, 10n)).toBe(10n);
      expect(math.clampI64Sync(-9223372036854775808n, -100n, 100n)).toBe(-100n);
    });
  });

  describe("clamp (U32)", () => {
    it("clampU32Sync clamps unsigned 32-bit integers", () => {
      expect(math.clampU32Sync(5, 0, 10)).toBe(5);
      expect(math.clampU32Sync(0, 5, 10)).toBe(5);
      expect(math.clampU32Sync(100, 0, 50)).toBe(50);
      expect(math.clampU32Sync(0xFFFFFFFF >>> 0, 0, 255)).toBe(255);
    });
  });

  describe("clamp (U64)", () => {
    it("clampU64Sync clamps unsigned 64-bit integers", () => {
      expect(math.clampU64Sync(5n, 0n, 10n)).toBe(5n);
      expect(math.clampU64Sync(0n, 5n, 10n)).toBe(5n);
      expect(math.clampU64Sync(100n, 0n, 50n)).toBe(50n);
      expect(math.clampU64Sync(0xFFFFFFFFFFFFFFFFn, 0n, 255n)).toBe(255n);
    });
  });
});

describe("Sync 32-bit bit manipulation", () => {
  describe("bswap sync variants", () => {
    it("bswap16Sync swaps bytes", () => {
      expect(math.bswap16Sync(0x1234)).toBe(0x3412);
      expect(math.bswap16Sync(0xAABB)).toBe(0xBBAA);
    });

    it("bswap32Sync swaps bytes", () => {
      expect(math.bswap32Sync(0x12345678)).toBe(0x78563412);
      // WASM returns signed i32, use >>> 0 for unsigned comparison
      expect(math.bswap32Sync(0xAABBCCDD) >>> 0).toBe(0xDDCCBBAA);
    });
  });

  describe("rotation sync variants", () => {
    it("rotlSync rotates left", () => {
      expect(math.rotlSync(0b00000001, 1)).toBe(0b00000010);
      expect(math.rotlSync(0x80000000, 1)).toBe(0b00000001);
      expect(math.rotlSync(4, 1)).toBe(8);
    });

    it("rotrSync rotates right", () => {
      expect(math.rotrSync(0b00000010, 1)).toBe(0b00000001);
      expect(math.rotrSync(0b00000001, 1) >>> 0).toBe(0x80000000);
      expect(math.rotrSync(8, 1)).toBe(4);
    });
  });
});

/**
 * Tests for async F32 variants that aren't covered in the main test file
 */
describe("Async F32 coverage", () => {
  it("isNaNF32 async variant works", async () => {
    expect(await math.isNaNF32(NaN)).toBe(true);
    expect(await math.isNaNF32(42)).toBe(false);
  });

  it("isInfF32 async variant works", async () => {
    expect(await math.isInfF32(Infinity)).toBe(true);
    expect(await math.isInfF32(-Infinity)).toBe(true);
    expect(await math.isInfF32(42)).toBe(false);
  });

  it("isFiniteF32 async variant works", async () => {
    expect(await math.isFiniteF32(42)).toBe(true);
    expect(await math.isFiniteF32(Infinity)).toBe(false);
  });

  it("signF32 async variant works", async () => {
    expect(await math.signF32(42.5)).toBe(1);
    expect(await math.signF32(-42.5)).toBe(-1);
    expect(await math.signF32(0)).toBe(0);
  });

  it("fmodF32 async variant works", async () => {
    expect(await math.fmodF32(5.5, 2.0)).toBeCloseTo(1.5, 5);
  });

  it("copysignF32 async variant works", async () => {
    expect(await math.copysignF32(5.0, -1.0)).toBe(-5.0);
    expect(await math.copysignF32(-5.0, 1.0)).toBe(5.0);
  });

  it("floorF32 async variant works", async () => {
    expect(await math.floorF32(3.7)).toBe(3);
    expect(await math.floorF32(-3.2)).toBe(-4);
  });

  it("ceilF32 async variant works", async () => {
    expect(await math.ceilF32(3.2)).toBe(4);
    expect(await math.ceilF32(-3.7)).toBe(-3);
  });

  it("roundF32 async variant works", async () => {
    expect(await math.roundF32(3.4)).toBe(3);
    expect(await math.roundF32(3.5)).toBe(4);
    expect(await math.roundF32(-3.5)).toBe(-4);
  });

  it("truncF32 async variant works", async () => {
    expect(await math.truncF32(3.7)).toBe(3);
    expect(await math.truncF32(-3.7)).toBe(-3);
  });
});

/**
 * Tests for async U64 bit manipulation variants
 */
describe("Async U64 bit ops coverage", () => {
  it("rotlU64 async variant works", async () => {
    expect(await math.rotlU64(1n, 1)).toBe(2n);
    expect(BigInt.asUintN(64, await math.rotlU64(1n, 63))).toBe(0x8000000000000000n);
  });

  it("rotrU64 async variant works", async () => {
    expect(await math.rotrU64(2n, 1)).toBe(1n);
    expect(BigInt.asUintN(64, await math.rotrU64(1n, 1))).toBe(0x8000000000000000n);
  });
});

/**
 * Tests for async power/root F32 variants
 */
describe("Async power/root F32 coverage", () => {
  it("sqrtF32 async variant works", async () => {
    expect(await math.sqrtF32(4)).toBeCloseTo(2, 5);
    expect(await math.sqrtF32(9)).toBeCloseTo(3, 5);
  });

  it("cbrtF32 async variant works", async () => {
    expect(await math.cbrtF32(8)).toBeCloseTo(2, 5);
    expect(await math.cbrtF32(27)).toBeCloseTo(3, 5);
    expect(await math.cbrtF32(-8)).toBeCloseTo(-2, 5);
  });

  it("powF32 async variant works", async () => {
    expect(await math.powF32(2, 3)).toBeCloseTo(8, 5);
    expect(await math.powF32(5, 2)).toBeCloseTo(25, 5);
  });

  it("hypotF32 async variant works", async () => {
    expect(await math.hypotF32(3, 4)).toBeCloseTo(5, 5);
    expect(await math.hypotF32(5, 12)).toBeCloseTo(13, 5);
  });
});

/**
 * Tests for async exp/log F32 variants
 */
describe("Async exp/log F32 coverage", () => {
  it("expF32 async variant works", async () => {
    expect(await math.expF32(0)).toBeCloseTo(1, 5);
    expect(await math.expF32(1)).toBeCloseTo(Math.E, 5);
  });

  it("exp2F32 async variant works", async () => {
    expect(await math.exp2F32(0)).toBeCloseTo(1, 5);
    expect(await math.exp2F32(10)).toBeCloseTo(1024, 5);
  });

  it("expm1F32 async variant works", async () => {
    expect(await math.expm1F32(0)).toBeCloseTo(0, 5);
    expect(await math.expm1F32(1)).toBeCloseTo(Math.E - 1, 4);
  });

  it("logF32 async variant works", async () => {
    expect(await math.logF32(1)).toBeCloseTo(0, 5);
    expect(await math.logF32(Math.E)).toBeCloseTo(1, 5);
  });

  it("log2F32 async variant works", async () => {
    expect(await math.log2F32(1)).toBeCloseTo(0, 5);
    expect(await math.log2F32(1024)).toBeCloseTo(10, 5);
  });

  it("log10F32 async variant works", async () => {
    expect(await math.log10F32(1)).toBeCloseTo(0, 5);
    expect(await math.log10F32(100)).toBeCloseTo(2, 5);
  });

  it("log1pF32 async variant works", async () => {
    expect(await math.log1pF32(0)).toBeCloseTo(0, 5);
    expect(await math.log1pF32(Math.E - 1)).toBeCloseTo(1, 4);
  });
});

/**
 * Tests for async trigonometric F32 variants
 */
describe("Async trig F32 coverage", () => {
  it("sinF32 async variant works", async () => {
    expect(await math.sinF32(0)).toBeCloseTo(0, 5);
    expect(await math.sinF32(Math.PI / 2)).toBeCloseTo(1, 5);
  });

  it("cosF32 async variant works", async () => {
    expect(await math.cosF32(0)).toBeCloseTo(1, 5);
    expect(await math.cosF32(Math.PI)).toBeCloseTo(-1, 5);
  });

  it("tanF32 async variant works", async () => {
    expect(await math.tanF32(0)).toBeCloseTo(0, 5);
    expect(await math.tanF32(Math.PI / 4)).toBeCloseTo(1, 5);
  });

  it("asinF32 async variant works", async () => {
    expect(await math.asinF32(0)).toBeCloseTo(0, 5);
    expect(await math.asinF32(1)).toBeCloseTo(Math.PI / 2, 5);
  });

  it("acosF32 async variant works", async () => {
    expect(await math.acosF32(1)).toBeCloseTo(0, 5);
    expect(await math.acosF32(0)).toBeCloseTo(Math.PI / 2, 5);
  });

  it("atanF32 async variant works", async () => {
    expect(await math.atanF32(0)).toBeCloseTo(0, 5);
    expect(await math.atanF32(1)).toBeCloseTo(Math.PI / 4, 5);
  });

  it("atan2F32 async variant works", async () => {
    expect(await math.atan2F32(0, 1)).toBeCloseTo(0, 5);
    expect(await math.atan2F32(1, 0)).toBeCloseTo(Math.PI / 2, 5);
  });
});

/**
 * Tests for async hyperbolic F32 variants
 */
describe("Async hyperbolic F32 coverage", () => {
  it("sinhF32 async variant works", async () => {
    expect(await math.sinhF32(0)).toBeCloseTo(0, 5);
    expect(await math.sinhF32(1)).toBeCloseTo(1.175201, 4);
  });

  it("coshF32 async variant works", async () => {
    expect(await math.coshF32(0)).toBeCloseTo(1, 5);
    expect(await math.coshF32(1)).toBeCloseTo(1.543081, 4);
  });

  it("tanhF32 async variant works", async () => {
    expect(await math.tanhF32(0)).toBeCloseTo(0, 5);
    expect(await math.tanhF32(1)).toBeCloseTo(0.761594, 4);
  });

  it("asinhF32 async variant works", async () => {
    expect(await math.asinhF32(0)).toBeCloseTo(0, 5);
    expect(await math.asinhF32(1)).toBeCloseTo(0.881373, 4);
  });

  it("acoshF32 async variant works", async () => {
    expect(await math.acoshF32(1)).toBeCloseTo(0, 5);
    expect(await math.acoshF32(2)).toBeCloseTo(1.316958, 4);
  });

  it("atanhF32 async variant works", async () => {
    expect(await math.atanhF32(0)).toBeCloseTo(0, 5);
    expect(await math.atanhF32(0.5)).toBeCloseTo(0.549306, 4);
  });
});
