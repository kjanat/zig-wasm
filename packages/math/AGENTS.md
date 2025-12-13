# @zig-wasm/math – Agent Notes

## Commands

- Build: `pnpm --filter @zig-wasm/math build`
- Test: `pnpm --filter @zig-wasm/math test`
- Lint: `pnpm --filter @zig-wasm/math lint` (fix: `lint:fix`)
- Format: `pnpm --filter @zig-wasm/math fmt`
- Typecheck: `pnpm --filter @zig-wasm/math typecheck`

## Implementation hints

- Async APIs lazy-load `math.wasm`; sync variants need `init()` first.
- Exposes many std.math functions; keep `F32` suffixes and sync names intact.
  Use `.ts` imports and double quotes.
