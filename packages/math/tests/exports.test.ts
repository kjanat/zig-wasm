import { beforeAll, describe, expect, it } from "vitest";
import * as math from "../src/index.ts";

beforeAll(async () => {
  await math.init();
});

describe("@zig-wasm/math exports", () => {
  it("exposes lifecycle helpers", () => {
    expect(math.isInitialized()).toBe(true);
    expect(math.init).toBeTypeOf("function");
  });

  it("exposes common math functions", () => {
    expect(math.sin).toBeTypeOf("function");
    expect(math.sqrt).toBeTypeOf("function");
    expect(math.clamp).toBeTypeOf("function");
  });

  it("exposes sync variants", () => {
    expect(math.sinSync).toBeTypeOf("function");
    expect(math.sqrtSync).toBeTypeOf("function");
    expect(math.clampSync).toBeTypeOf("function");
  });
});

describe("@zig-wasm/math - Basic Operations", () => {
  describe("abs", () => {
    it("computes absolute value for positive numbers", async () => {
      expect(await math.abs(42.5)).toBe(42.5);
      expect(math.absSync(42.5)).toBe(42.5);
    });

    it("computes absolute value for negative numbers", async () => {
      expect(await math.abs(-42.5)).toBe(42.5);
      expect(math.absSync(-42.5)).toBe(42.5);
    });

    it("handles zero", async () => {
      expect(await math.abs(0)).toBe(0);
      expect(await math.abs(-0)).toBe(0);
    });

    it("handles integer types", async () => {
      expect(await math.absI32(-100)).toBe(100);
      expect(await math.absI64(-9223372036854775807n)).toBe(9223372036854775807n);
    });

    it("preserves f32 precision", async () => {
      expect(await math.absF32(-3.14159)).toBeCloseTo(3.14159, 5);
    });
  });

  describe("min/max", () => {
    it("finds minimum of two numbers", async () => {
      expect(await math.min(5, 10)).toBe(5);
      expect(await math.min(-5, -10)).toBe(-10);
      expect(math.minSync(5, 10)).toBe(5);
    });

    it("finds maximum of two numbers", async () => {
      expect(await math.max(5, 10)).toBe(10);
      expect(await math.max(-5, -10)).toBe(-5);
      expect(math.maxSync(5, 10)).toBe(10);
    });

    it("handles equal values", async () => {
      expect(await math.min(5, 5)).toBe(5);
      expect(await math.max(5, 5)).toBe(5);
    });

    it("handles integer types correctly", async () => {
      expect(await math.minI32(-100, 100)).toBe(-100);
      expect(await math.maxI32(-100, 100)).toBe(100);
      expect(await math.minI64(-999n, 999n)).toBe(-999n);
      expect(await math.maxI64(-999n, 999n)).toBe(999n);
    });
  });

  describe("clamp", () => {
    it("clamps values within range", async () => {
      expect(await math.clamp(5, 0, 10)).toBe(5);
      expect(math.clampSync(5, 0, 10)).toBe(5);
    });

    it("clamps to lower bound", async () => {
      expect(await math.clamp(-5, 0, 10)).toBe(0);
      expect(await math.clampI32(-100, -50, 50)).toBe(-50);
    });

    it("clamps to upper bound", async () => {
      expect(await math.clamp(15, 0, 10)).toBe(10);
      expect(await math.clampI32(1000, 0, 255)).toBe(255);
    });

    it("handles boundary values", async () => {
      expect(await math.clamp(0, 0, 10)).toBe(0);
      expect(await math.clamp(10, 0, 10)).toBe(10);
    });
  });
});

describe("@zig-wasm/math - Power and Root Functions", () => {
  describe("sqrt", () => {
    it("computes square root of positive numbers", async () => {
      expect(await math.sqrt(4)).toBe(2);
      expect(await math.sqrt(9)).toBe(3);
      expect(await math.sqrt(2)).toBeCloseTo(1.41421356, 7);
      expect(math.sqrtSync(16)).toBe(4);
    });

    it("handles zero", async () => {
      expect(await math.sqrt(0)).toBe(0);
    });

    it("handles negative numbers (produces NaN)", async () => {
      expect(await math.sqrt(-1)).toBeNaN();
    });

    it("maintains f32 precision", async () => {
      expect(await math.sqrtF32(2)).toBeCloseTo(1.41421356, 5);
    });

    it("handles very large numbers", async () => {
      const result = await math.sqrt(1e308);
      expect(result).toBeCloseTo(1e154, -145);
    });

    it("handles very small numbers", async () => {
      const result = await math.sqrt(1e-308);
      expect(result).toBeCloseTo(1e-154, 160);
    });
  });

  describe("cbrt", () => {
    it("computes cube root of positive numbers", async () => {
      expect(await math.cbrt(8)).toBeCloseTo(2, 10);
      expect(await math.cbrt(27)).toBeCloseTo(3, 10);
      expect(math.cbrtSync(64)).toBeCloseTo(4, 10);
    });

    it("handles negative numbers", async () => {
      expect(await math.cbrt(-8)).toBeCloseTo(-2, 10);
      expect(await math.cbrt(-27)).toBeCloseTo(-3, 10);
    });

    it("handles zero", async () => {
      expect(await math.cbrt(0)).toBe(0);
    });
  });

  describe("pow", () => {
    it("computes integer powers", async () => {
      expect(await math.pow(2, 3)).toBe(8);
      expect(await math.pow(5, 2)).toBe(25);
      expect(math.powSync(3, 4)).toBe(81);
    });

    it("computes fractional powers", async () => {
      expect(await math.pow(4, 0.5)).toBeCloseTo(2, 10);
      expect(await math.pow(8, 1 / 3)).toBeCloseTo(2, 10);
    });

    it("handles negative exponents", async () => {
      expect(await math.pow(2, -2)).toBeCloseTo(0.25, 10);
      expect(await math.pow(10, -3)).toBeCloseTo(0.001, 10);
    });

    it("handles zero exponent", async () => {
      expect(await math.pow(100, 0)).toBe(1);
      expect(await math.pow(-5, 0)).toBe(1);
    });

    it("handles negative bases with integer exponents", async () => {
      expect(await math.pow(-2, 3)).toBeCloseTo(-8, 10);
      expect(await math.pow(-2, 4)).toBeCloseTo(16, 10);
    });
  });

  describe("hypot", () => {
    it("computes hypotenuse (Pythagorean theorem)", async () => {
      expect(await math.hypot(3, 4)).toBeCloseTo(5, 10);
      expect(await math.hypot(5, 12)).toBeCloseTo(13, 10);
      expect(math.hypotSync(8, 15)).toBeCloseTo(17, 10);
    });

    it("handles zero inputs", async () => {
      expect(await math.hypot(0, 0)).toBe(0);
      expect(await math.hypot(5, 0)).toBe(5);
      expect(await math.hypot(0, 5)).toBe(5);
    });

    it("handles negative inputs", async () => {
      expect(await math.hypot(-3, -4)).toBeCloseTo(5, 10);
    });
  });
});

describe("@zig-wasm/math - Exponential and Logarithmic Functions", () => {
  describe("exp", () => {
    it("computes e^x for positive x", async () => {
      expect(await math.exp(0)).toBeCloseTo(1, 10);
      expect(await math.exp(1)).toBeCloseTo(Math.E, 10);
      expect(await math.exp(2)).toBeCloseTo(7.389056, 5);
      expect(math.expSync(1)).toBeCloseTo(Math.E, 10);
    });

    it("computes e^x for negative x", async () => {
      expect(await math.exp(-1)).toBeCloseTo(1 / Math.E, 10);
      expect(await math.exp(-2)).toBeCloseTo(0.135335, 5);
    });

    it("handles overflow to infinity", async () => {
      expect(await math.exp(1000)).toBe(Infinity);
    });
  });

  describe("exp2", () => {
    it("computes 2^x", async () => {
      expect(await math.exp2(0)).toBe(1);
      expect(await math.exp2(1)).toBe(2);
      expect(await math.exp2(10)).toBe(1024);
      expect(math.exp2Sync(8)).toBe(256);
    });

    it("handles negative exponents", async () => {
      expect(await math.exp2(-1)).toBeCloseTo(0.5, 10);
      expect(await math.exp2(-10)).toBeCloseTo(0.0009765625, 10);
    });
  });

  describe("expm1", () => {
    it("computes e^x - 1 with high precision for small x", async () => {
      expect(await math.expm1(0)).toBe(0);
      expect(await math.expm1(1e-10)).toBeCloseTo(1e-10, 15);
      expect(math.expm1Sync(1)).toBeCloseTo(Math.E - 1, 10);
    });
  });

  describe("log", () => {
    it("computes natural logarithm", async () => {
      expect(await math.log(1)).toBe(0);
      expect(await math.log(Math.E)).toBeCloseTo(1, 10);
      expect(await math.log(10)).toBeCloseTo(2.302585, 5);
      expect(math.logSync(Math.E)).toBeCloseTo(1, 10);
    });

    it("handles domain errors (negative input)", async () => {
      expect(await math.log(-1)).toBeNaN();
      expect(await math.log(0)).toBe(-Infinity);
    });
  });

  describe("log2", () => {
    it("computes base-2 logarithm", async () => {
      expect(await math.log2(1)).toBe(0);
      expect(await math.log2(2)).toBe(1);
      expect(await math.log2(1024)).toBe(10);
      expect(math.log2Sync(256)).toBe(8);
    });
  });

  describe("log10", () => {
    it("computes base-10 logarithm", async () => {
      expect(await math.log10(1)).toBe(0);
      expect(await math.log10(10)).toBe(1);
      expect(await math.log10(1000)).toBeCloseTo(3, 10);
      expect(math.log10Sync(100)).toBe(2);
    });
  });

  describe("log1p", () => {
    it("computes log(1 + x) with high precision for small x", async () => {
      expect(await math.log1p(0)).toBe(0);
      expect(await math.log1p(1e-10)).toBeCloseTo(1e-10, 15);
      expect(math.log1pSync(Math.E - 1)).toBeCloseTo(1, 10);
    });
  });
});

describe("@zig-wasm/math - Trigonometric Functions", () => {
  describe("sin", () => {
    it("computes sine for standard angles", async () => {
      expect(await math.sin(0)).toBeCloseTo(0, 10);
      const piVal = await math.pi();
      expect(await math.sin(piVal / 2)).toBeCloseTo(1, 10);
      expect(await math.sin(piVal)).toBeCloseTo(0, 10);
      expect(math.sinSync(piVal / 6)).toBeCloseTo(0.5, 10);
    });

    it("computes sine for negative angles", async () => {
      const piVal = await math.pi();
      expect(await math.sin(-piVal / 2)).toBeCloseTo(-1, 10);
    });

    it("handles large values", async () => {
      expect(await math.sin(1e10)).toBeCloseTo(Math.sin(1e10), 5);
    });
  });

  describe("cos", () => {
    it("computes cosine for standard angles", async () => {
      expect(await math.cos(0)).toBeCloseTo(1, 10);
      const piVal = await math.pi();
      expect(await math.cos(piVal / 2)).toBeCloseTo(0, 10);
      expect(await math.cos(piVal)).toBeCloseTo(-1, 10);
      expect(math.cosSync(0)).toBeCloseTo(1, 10);
    });
  });

  describe("tan", () => {
    it("computes tangent for standard angles", async () => {
      expect(await math.tan(0)).toBeCloseTo(0, 10);
      const piVal = await math.pi();
      expect(await math.tan(piVal / 4)).toBeCloseTo(1, 10);
      expect(math.tanSync(piVal / 4)).toBeCloseTo(1, 10);
    });
  });

  describe("asin", () => {
    it("computes arcsine within valid domain [-1, 1]", async () => {
      expect(await math.asin(0)).toBe(0);
      expect(await math.asin(1)).toBeCloseTo(Math.PI / 2, 10);
      expect(await math.asin(-1)).toBeCloseTo(-Math.PI / 2, 10);
      expect(math.asinSync(0.5)).toBeCloseTo(Math.PI / 6, 10);
    });

    it("handles domain errors (|x| > 1)", async () => {
      expect(await math.asin(1.1)).toBeNaN();
      expect(await math.asin(-1.1)).toBeNaN();
    });
  });

  describe("acos", () => {
    it("computes arccosine within valid domain [-1, 1]", async () => {
      expect(await math.acos(1)).toBeCloseTo(0, 10);
      expect(await math.acos(0)).toBeCloseTo(Math.PI / 2, 10);
      expect(await math.acos(-1)).toBeCloseTo(Math.PI, 10);
      expect(math.acosSync(0.5)).toBeCloseTo(Math.PI / 3, 10);
    });

    it("handles domain errors (|x| > 1)", async () => {
      expect(await math.acos(1.1)).toBeNaN();
      expect(await math.acos(-1.1)).toBeNaN();
    });
  });

  describe("atan", () => {
    it("computes arctangent", async () => {
      expect(await math.atan(0)).toBe(0);
      expect(await math.atan(1)).toBeCloseTo(Math.PI / 4, 10);
      expect(await math.atan(-1)).toBeCloseTo(-Math.PI / 4, 10);
      expect(math.atanSync(1)).toBeCloseTo(Math.PI / 4, 10);
    });

    it("handles extreme values", async () => {
      expect(await math.atan(Infinity)).toBeCloseTo(Math.PI / 2, 10);
      expect(await math.atan(-Infinity)).toBeCloseTo(-Math.PI / 2, 10);
    });
  });

  describe("atan2", () => {
    it("computes two-argument arctangent", async () => {
      expect(await math.atan2(0, 1)).toBeCloseTo(0, 10);
      expect(await math.atan2(1, 0)).toBeCloseTo(Math.PI / 2, 10);
      expect(await math.atan2(1, 1)).toBeCloseTo(Math.PI / 4, 10);
      expect(math.atan2Sync(-1, -1)).toBeCloseTo(-3 * Math.PI / 4, 10);
    });

    it("handles quadrants correctly", async () => {
      expect(await math.atan2(1, -1)).toBeCloseTo(3 * Math.PI / 4, 10);
      expect(await math.atan2(-1, 1)).toBeCloseTo(-Math.PI / 4, 10);
    });
  });
});

describe("@zig-wasm/math - Hyperbolic Functions", () => {
  describe("sinh", () => {
    it("computes hyperbolic sine", async () => {
      expect(await math.sinh(0)).toBe(0);
      expect(await math.sinh(1)).toBeCloseTo(1.175201, 5);
      expect(await math.sinh(-1)).toBeCloseTo(-1.175201, 5);
      expect(math.sinhSync(1)).toBeCloseTo(1.175201, 5);
    });
  });

  describe("cosh", () => {
    it("computes hyperbolic cosine", async () => {
      expect(await math.cosh(0)).toBe(1);
      expect(await math.cosh(1)).toBeCloseTo(1.543081, 5);
      expect(await math.cosh(-1)).toBeCloseTo(1.543081, 5);
      expect(math.coshSync(1)).toBeCloseTo(1.543081, 5);
    });
  });

  describe("tanh", () => {
    it("computes hyperbolic tangent", async () => {
      expect(await math.tanh(0)).toBe(0);
      expect(await math.tanh(1)).toBeCloseTo(0.761594, 5);
      expect(await math.tanh(-1)).toBeCloseTo(-0.761594, 5);
      expect(math.tanhSync(Infinity)).toBe(1);
      expect(await math.tanh(-Infinity)).toBe(-1);
    });
  });

  describe("asinh", () => {
    it("computes inverse hyperbolic sine", async () => {
      expect(await math.asinh(0)).toBe(0);
      expect(await math.asinh(1)).toBeCloseTo(0.881373, 5);
      expect(await math.asinh(-1)).toBeCloseTo(-0.881373, 5);
      expect(math.asinhSync(1)).toBeCloseTo(0.881373, 5);
    });
  });

  describe("acosh", () => {
    it("computes inverse hyperbolic cosine for x >= 1", async () => {
      expect(await math.acosh(1)).toBe(0);
      expect(await math.acosh(2)).toBeCloseTo(1.316958, 5);
      expect(math.acoshSync(10)).toBeCloseTo(2.993223, 5);
    });

    it("handles domain errors (x < 1)", async () => {
      expect(await math.acosh(0.5)).toBeNaN();
      expect(await math.acosh(-1)).toBeNaN();
    });
  });

  describe("atanh", () => {
    it("computes inverse hyperbolic tangent for |x| < 1", async () => {
      expect(await math.atanh(0)).toBe(0);
      expect(await math.atanh(0.5)).toBeCloseTo(0.549306, 5);
      expect(await math.atanh(-0.5)).toBeCloseTo(-0.549306, 5);
      expect(math.atanhSync(0.5)).toBeCloseTo(0.549306, 5);
    });

    it("handles domain errors (|x| >= 1)", async () => {
      expect(await math.atanh(1)).toBe(Infinity);
      expect(await math.atanh(-1)).toBe(-Infinity);
      expect(await math.atanh(1.1)).toBeNaN();
    });
  });
});

describe("@zig-wasm/math - Rounding Functions", () => {
  describe("floor", () => {
    it("rounds down to nearest integer", async () => {
      expect(await math.floor(3.7)).toBe(3);
      expect(await math.floor(3.2)).toBe(3);
      expect(await math.floor(-3.2)).toBe(-4);
      expect(await math.floor(-3.7)).toBe(-4);
      expect(math.floorSync(2.9)).toBe(2);
    });

    it("handles integers", async () => {
      expect(await math.floor(5)).toBe(5);
      expect(await math.floor(-5)).toBe(-5);
    });
  });

  describe("ceil", () => {
    it("rounds up to nearest integer", async () => {
      expect(await math.ceil(3.2)).toBe(4);
      expect(await math.ceil(3.7)).toBe(4);
      expect(await math.ceil(-3.7)).toBe(-3);
      expect(await math.ceil(-3.2)).toBe(-3);
      expect(math.ceilSync(2.1)).toBe(3);
    });

    it("handles integers", async () => {
      expect(await math.ceil(5)).toBe(5);
      expect(await math.ceil(-5)).toBe(-5);
    });
  });

  describe("round", () => {
    it("rounds to nearest integer (ties away from zero)", async () => {
      expect(await math.round(3.4)).toBe(3);
      expect(await math.round(3.5)).toBe(4);
      expect(await math.round(3.6)).toBe(4);
      expect(await math.round(-3.4)).toBe(-3);
      expect(await math.round(-3.5)).toBe(-4);
      expect(math.roundSync(2.5)).toBe(3);
    });
  });

  describe("trunc", () => {
    it("truncates decimal part (rounds toward zero)", async () => {
      expect(await math.trunc(3.7)).toBe(3);
      expect(await math.trunc(3.2)).toBe(3);
      expect(await math.trunc(-3.7)).toBe(-3);
      expect(await math.trunc(-3.2)).toBe(-3);
      expect(math.truncSync(-2.9)).toBe(-2);
    });
  });
});

describe("@zig-wasm/math - Classification Functions", () => {
  describe("isNaN", () => {
    it("detects NaN values", async () => {
      expect(await math.isNaN(NaN)).toBe(true);
      expect(await math.isNaN(0 / 0)).toBe(true);
      expect(math.isNaNSync(NaN)).toBe(true);
    });

    it("returns false for non-NaN values", async () => {
      expect(await math.isNaN(0)).toBe(false);
      expect(await math.isNaN(Infinity)).toBe(false);
      expect(await math.isNaN(-Infinity)).toBe(false);
      expect(await math.isNaN(42)).toBe(false);
    });
  });

  describe("isInf", () => {
    it("detects infinite values", async () => {
      expect(await math.isInf(Infinity)).toBe(true);
      expect(await math.isInf(-Infinity)).toBe(true);
      expect(await math.isInf(1 / 0)).toBe(true);
      expect(math.isInfSync(-Infinity)).toBe(true);
    });

    it("returns false for finite values", async () => {
      expect(await math.isInf(0)).toBe(false);
      expect(await math.isInf(1e308)).toBe(false);
      expect(await math.isInf(NaN)).toBe(false);
    });
  });

  describe("isFinite", () => {
    it("detects finite values", async () => {
      expect(await math.isFinite(0)).toBe(true);
      expect(await math.isFinite(42)).toBe(true);
      expect(await math.isFinite(-1e308)).toBe(true);
      expect(math.isFiniteSync(3.14)).toBe(true);
    });

    it("returns false for infinite and NaN values", async () => {
      expect(await math.isFinite(Infinity)).toBe(false);
      expect(await math.isFinite(-Infinity)).toBe(false);
      expect(await math.isFinite(NaN)).toBe(false);
    });
  });

  describe("sign", () => {
    it("returns sign of positive numbers", async () => {
      expect(await math.sign(42)).toBe(1);
      expect(await math.sign(0.1)).toBe(1);
      expect(math.signSync(1e10)).toBe(1);
    });

    it("returns sign of negative numbers", async () => {
      expect(await math.sign(-42)).toBe(-1);
      expect(await math.sign(-0.1)).toBe(-1);
    });

    it("handles zero", async () => {
      expect(await math.sign(0)).toBe(0);
      expect(await math.sign(-0)).toBe(0);
    });

    it("handles NaN", async () => {
      const result = await math.sign(NaN);
      expect(Number.isNaN(result) || result === 0).toBe(true);
    });
  });
});

describe("@zig-wasm/math - Constants", () => {
  describe("pi", () => {
    it("returns accurate pi value", async () => {
      expect(await math.pi()).toBeCloseTo(Math.PI, 15);
      expect(math.piSync()).toBeCloseTo(Math.PI, 15);
    });

    it("f32 variant has lower precision", async () => {
      expect(await math.piF32()).toBeCloseTo(Math.PI, 6);
    });
  });

  describe("e", () => {
    it("returns accurate e value", async () => {
      expect(await math.e()).toBeCloseTo(Math.E, 15);
      expect(math.eSync()).toBeCloseTo(Math.E, 15);
    });

    it("f32 variant has lower precision", async () => {
      expect(await math.eF32()).toBeCloseTo(Math.E, 6);
    });
  });

  describe("ln2", () => {
    it("returns accurate ln(2) value", async () => {
      expect(await math.ln2()).toBeCloseTo(Math.LN2, 15);
      expect(math.ln2Sync()).toBeCloseTo(Math.LN2, 15);
    });
  });

  describe("ln10", () => {
    it("returns accurate ln(10) value", async () => {
      expect(await math.ln10()).toBeCloseTo(Math.LN10, 15);
      expect(math.ln10Sync()).toBeCloseTo(Math.LN10, 15);
    });
  });
});

describe("@zig-wasm/math - Bit Manipulation", () => {
  describe("clz (count leading zeros)", () => {
    it("counts leading zeros in 32-bit integers", async () => {
      expect(await math.clz(0b00000001)).toBe(31);
      expect(await math.clz(0b00000010)).toBe(30);
      expect(await math.clz(0b10000000000000000000000000000000)).toBe(0);
      expect(math.clzSync(0b00001000)).toBe(28);
    });

    it("handles zero", async () => {
      expect(await math.clz(0)).toBe(32);
    });

    it("works with 64-bit integers", async () => {
      expect(await math.clzU64(1n)).toBe(63n);
      expect(await math.clzU64(0xFFFFFFFFFFFFFFFFn)).toBe(0n);
    });
  });

  describe("ctz (count trailing zeros)", () => {
    it("counts trailing zeros in 32-bit integers", async () => {
      expect(await math.ctz(0b10000000)).toBe(7);
      expect(await math.ctz(0b01000000)).toBe(6);
      expect(await math.ctz(0b00000001)).toBe(0);
      expect(math.ctzSync(0b00010000)).toBe(4);
    });

    it("handles zero", async () => {
      expect(await math.ctz(0)).toBe(32);
    });

    it("works with 64-bit integers", async () => {
      expect(await math.ctzU64(8n)).toBe(3n);
    });
  });

  describe("popcount (count set bits)", () => {
    it("counts set bits in 32-bit integers", async () => {
      expect(await math.popcount(0b0000)).toBe(0);
      expect(await math.popcount(0b0001)).toBe(1);
      expect(await math.popcount(0b1111)).toBe(4);
      expect(await math.popcount(0b10101010)).toBe(4);
      expect(math.popcountSync(0b11111111)).toBe(8);
    });

    it("works with 64-bit integers", async () => {
      expect(await math.popcountU64(0xFFFFFFFFFFFFFFFFn)).toBe(64n);
      expect(await math.popcountU64(0n)).toBe(0n);
    });
  });

  describe("bswap (byte swap)", () => {
    it("swaps bytes in 16-bit integers", async () => {
      expect(await math.bswap16(0x1234)).toBe(0x3412);
      expect(math.bswap16Sync(0xAABB)).toBe(0xBBAA);
    });

    it("swaps bytes in 32-bit integers", async () => {
      const result = await math.bswap32(0x12345678);
      expect(result).toBe(0x78563412);
    });

    it("swaps bytes in 64-bit integers", async () => {
      const result = await math.bswap64(0x0011223344556677n);
      expect(result).toBe(0x7766554433221100n);
    });
  });

  describe("rotl/rotr (bit rotation)", () => {
    it("rotates left", async () => {
      expect(await math.rotl(0b00000001, 1)).toBe(0b00000010);
      expect(await math.rotl(0x80000000, 1)).toBe(0b00000000000000000000000000000001);
    });

    it("rotates right", async () => {
      expect(await math.rotr(0b00000010, 1)).toBe(0b00000001);
      const rotrResult = await math.rotr(0b00000001, 1);
      expect(rotrResult >>> 0).toBe(0x80000000);
    });

    it("verifies basic rotation behavior", async () => {
      expect(await math.rotl(4, 1)).toBe(8);
      expect(await math.rotr(8, 1)).toBe(4);
    });
  });
});

describe("@zig-wasm/math - Integer Math", () => {
  describe("gcd (greatest common divisor)", () => {
    it("computes GCD of two positive integers", async () => {
      expect(await math.gcd(12, 8)).toBe(4);
      expect(await math.gcd(21, 14)).toBe(7);
      expect(await math.gcd(17, 19)).toBe(1);
      expect(math.gcdSync(100, 50)).toBe(50);
    });

    it("handles zero", async () => {
      expect(await math.gcd(0, 5)).toBe(5);
      expect(await math.gcd(5, 0)).toBe(5);
    });

    it("handles equal values", async () => {
      expect(await math.gcd(42, 42)).toBe(42);
    });

    it("works with 64-bit integers", async () => {
      expect(await math.gcdU64(123456n, 789012n)).toBe(12n);
    });
  });
});

describe("@zig-wasm/math - Floating-Point Utilities", () => {
  describe("fmod (floating-point remainder)", () => {
    it("computes remainder of division", async () => {
      expect(await math.fmod(5.5, 2.0)).toBeCloseTo(1.5, 10);
      expect(await math.fmod(10.0, 3.0)).toBeCloseTo(1.0, 10);
      expect(math.fmodSync(7.5, 2.5)).toBeCloseTo(0, 10);
    });

    it("handles negative dividends", async () => {
      const result1 = await math.fmod(-5.5, 2.0);
      const result2 = await math.fmod(-10.0, 3.0);
      expect(Math.abs(result1 + 1.5) < 0.01 || Math.abs(result1 - 0.5) < 0.01).toBe(true);
      expect(Math.abs(result2 + 1.0) < 0.01 || Math.abs(result2 - 2.0) < 0.01).toBe(true);
    });

    it("handles negative divisors", async () => {
      expect(await math.fmod(5.5, -2.0)).toBeCloseTo(1.5, 10);
    });
  });

  describe("copysign", () => {
    it("copies sign from second argument to first", async () => {
      expect(await math.copysign(5.0, 1.0)).toBe(5.0);
      expect(await math.copysign(5.0, -1.0)).toBe(-5.0);
      expect(await math.copysign(-5.0, 1.0)).toBe(5.0);
      expect(await math.copysign(-5.0, -1.0)).toBe(-5.0);
      expect(math.copysignSync(3.14, -1.0)).toBe(-3.14);
    });

    it("handles zero", async () => {
      expect(await math.copysign(0, -1)).toBe(-0);
      expect(await math.copysign(-0, 1)).toBe(0);
    });
  });
});

describe("@zig-wasm/math - Edge Cases and Precision", () => {
  describe("NaN propagation", () => {
    it("propagates NaN through operations", async () => {
      expect(await math.abs(NaN)).toBeNaN();
      expect(await math.sqrt(NaN)).toBeNaN();
      expect(await math.sin(NaN)).toBeNaN();
      expect(await math.exp(NaN)).toBeNaN();
      expect(await math.pow(NaN, 2)).toBeNaN();
      expect(await math.pow(2, NaN)).toBeNaN();
    });
  });

  describe("Infinity handling", () => {
    it("handles infinity in basic operations", async () => {
      expect(await math.abs(Infinity)).toBe(Infinity);
      expect(await math.abs(-Infinity)).toBe(Infinity);
      expect(await math.sqrt(Infinity)).toBe(Infinity);
    });

    it("handles infinity in trigonometric functions", async () => {
      expect(await math.sin(Infinity)).toBeNaN();
      expect(await math.cos(Infinity)).toBeNaN();
    });

    it("handles infinity in exponential functions", async () => {
      expect(await math.exp(Infinity)).toBe(Infinity);
      expect(await math.exp(-Infinity)).toBe(0);
      expect(await math.log(Infinity)).toBe(Infinity);
    });
  });

  describe("Precision and rounding", () => {
    it("maintains double precision (f64) accuracy", async () => {
      const result = await math.sin(Math.PI / 4);
      expect(result).toBeCloseTo(Math.SQRT2 / 2, 15);
    });

    it("f32 has reduced precision compared to f64", async () => {
      const f64Result = await math.sin(1.23456789);
      const f32Result = await math.sinF32(1.23456789);
      expect(f64Result).toBeCloseTo(f32Result, 6);
    });

    it("handles denormalized numbers", async () => {
      const tiny = 1e-320;
      expect(await math.abs(tiny)).toBe(tiny);
      expect(await math.sqrt(tiny)).toBeCloseTo(Math.sqrt(tiny), 100);
    });
  });

  describe("Cross-platform consistency", () => {
    it("async and sync variants produce identical results", async () => {
      expect(await math.sin(1.5)).toBe(math.sinSync(1.5));
      expect(await math.sqrt(2)).toBe(math.sqrtSync(2));
      expect(await math.exp(1)).toBe(math.expSync(1));
      expect(await math.abs(-42)).toBe(math.absSync(-42));
      expect(await math.max(5, 10)).toBe(math.maxSync(5, 10));
    });
  });
});
