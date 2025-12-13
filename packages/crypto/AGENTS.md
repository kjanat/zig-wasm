# @zig-wasm/crypto – Agent Notes

## Commands

- Build: `pnpm --filter @zig-wasm/crypto build`
- Test: `pnpm --filter @zig-wasm/crypto test`
- Lint: `pnpm --filter @zig-wasm/crypto lint` (fix: `lint:fix`)
- Format: `pnpm --filter @zig-wasm/crypto fmt`
- Typecheck: `pnpm --filter @zig-wasm/crypto typecheck`

## Implementation hints

- Async APIs lazy-load `crypto.wasm`; sync hashes/HMACs require `init()` first.
- Keep algorithm names aligned with `HashAlgorithm`/`HmacAlgorithm` types; use
  `.ts` imports and double quotes.
