# @zig-wasm/compress – Agent Notes

## Commands

- Build: `pnpm --filter @zig-wasm/compress build`
- Test: `pnpm --filter @zig-wasm/compress test`
- Lint: `pnpm --filter @zig-wasm/compress lint` (fix: `lint:fix`)
- Format: `pnpm --filter @zig-wasm/compress fmt`
- Typecheck: `pnpm --filter @zig-wasm/compress typecheck`

## Implementation hints

- Async APIs lazy-load `compress.wasm`; sync APIs require `init()` first.
- Respect dprint formatting and double-quoted strings; include `.ts` in relative
  imports.
