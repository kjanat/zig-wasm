import { tool } from "@opencode-ai/plugin";
import "../node_modules/@opencode-ai/plugin/dist/index.d.ts";

// dprint-ignore
import {
  // utility
  abs,acos,acosh,asin,asinh,atan,atan2,atanh,bswap16,cbrt,ceil,clamp,
  // bit ops
  clz, copysign, cos, cosh, ctz, e,
  // exponential / log
  exp, exp2, expm1,
  // rounding
  floor, hypot, ln2, ln10, log, log1p, log2, log10, max, min,
  // constants
  pi, popcount, pow, rotl, rotr, round, sign,
  // trig
  sin,
  // hyperbolic
  sinh,
  // power
  sqrt, tan, tanh, trunc,
} from "../../packages/math/dist/index.mjs";

const FNS = /* dprint-ignore */ [
  "sin", "cos", "tan", "asin", "acos", "atan", "atan2", "sinh", "cosh", "tanh",
  "asinh", "acosh", "atanh", "exp", "exp2", "expm1", "log", "log2", "log10",
  "log1p", "sqrt", "cbrt", "pow", "hypot", "floor", "ceil", "round", "trunc",
  "abs", "min", "max", "clamp", "sign", "copysign", "clz", "ctz", "popcount",
  "bswap16", "rotl", "rotr", "pi", "e", "ln2", "ln10",
] as const;

type MathFn = (typeof FNS)[number];

const IMPL: Record<
  MathFn,
  (...args: number[]) => Promise<number> | number
> = /* dprint-ignore */ {
  sin, cos, tan, asin, acos, atan, atan2, sinh, cosh, tanh, asinh, acosh, atanh,
  exp, exp2, expm1, log, log2, log10, log1p, sqrt, cbrt, pow, hypot, floor,
  ceil, round, trunc, abs, min, max, clamp, sign, copysign, clz, ctz, popcount,
  bswap16, rotl, rotr, pi, e, ln2, ln10,
};

export const call = tool({
  description: "Call a @zig-wasm/math function by name (sin, cos, exp, sqrt, clamp, bit ops, constants, etc).",
  args: {
    fn: tool.schema
      .enum(FNS as unknown as [MathFn, ...MathFn[]])
      .describe("Name of the math function to call"),
    args: tool.schema
      .array(tool.schema.number())
      .default([])
      .describe("Arguments to pass to the function"),
  },
  async execute({ fn, args }) {
    const impl = IMPL[fn];
    const result = await impl(...args);
    return JSON.stringify({ fn, args, result });
  },
});
