# @zig-wasm/base64 – Agent Notes

## Commands

- Build: `pnpm --filter @zig-wasm/base64 build`
- Test: `pnpm --filter @zig-wasm/base64 test`
- Lint: `pnpm --filter @zig-wasm/base64 lint` (fix: `lint:fix`)
- Format: `pnpm --filter @zig-wasm/base64 fmt`
- Typecheck: `pnpm --filter @zig-wasm/base64 typecheck`

## Implementation hints

- Async APIs lazy-load `base64.wasm`; sync APIs require `init()` first.
- Use `.ts` extensions in relative imports; `import type` for type-only.
- Keep strings double-quoted; formatting is handled by dprint.
