# @zig-wasm/std – Agent Notes

## Commands

- Build: `pnpm --filter @zig-wasm/std build`
- Test: `pnpm --filter @zig-wasm/std test`
- Lint: `pnpm --filter @zig-wasm/std lint` (fix: `lint:fix`)
- Format: `pnpm --filter @zig-wasm/std fmt`
- Typecheck: `pnpm --filter @zig-wasm/std typecheck`

## Implementation hints

- Umbrella package that re-exports base64, compress, crypto, hash, math, and
  core helpers.
- Keep re-export lists tidy; ensure `.ts` import extensions and double quotes.
  Each submodule lazily loads its own WASM; sync APIs still require calling that
  module's `init()`.
