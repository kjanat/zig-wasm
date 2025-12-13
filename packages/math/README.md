# @zig-wasm/math

High-performance math functions powered by Zig via WebAssembly. Exposes a wide
slice of Zig's `std.math` for both async (lazy-loaded) and sync use.

## Install

- `pnpm add @zig-wasm/math`

## Quick start

```ts
import { clamp, sin, sqrt } from "@zig-wasm/math";

const angle = await sin(Math.PI / 2); // 1
const mag = await sqrt(42); // double precision
const clamped = await clamp(12, 0, 10); // 10
```

Sync access requires explicit init:

```ts
import { init, sinSync } from "@zig-wasm/math";

await init();
const value = sinSync(0.5);
```

## What is exported?

- Trigonometry, hyperbolic, exponentials/logs, roots, rounding, comparisons.
- Bitwise integer utilities: `bswap*`, `clz/ctz`, `rotl/rotr`, `popcount`.
- Constants and helpers: `pi`, `e`, `isFinite`, `isNaN`, `gcd`, `clamp`, etc.
- Names suffixed with `F32` operate on 32-bit floats; plain versions use f64 or
  integers as appropriate.
- `getExports` / `getExportsSync` expose the underlying WASM exports for
  advanced use.

See `src/index.ts` for the full export list.

## WASM loading options

- Async APIs lazy-load `math.wasm`.
- Override with `init({ wasmUrl | wasmPath | wasmBytes, imports })` if you need
  custom hosting.

## Package scripts

- Build: `pnpm --filter @zig-wasm/math build`
- Test: `pnpm --filter @zig-wasm/math test`
- Lint/format: `pnpm --filter @zig-wasm/math lint` /
  `pnpm --filter @zig-wasm/math fmt`
- Typecheck: `pnpm --filter @zig-wasm/math typecheck`
