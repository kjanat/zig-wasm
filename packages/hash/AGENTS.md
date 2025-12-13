# @zig-wasm/hash – Agent Notes

## Commands

- Build: `pnpm --filter @zig-wasm/hash build`
- Test: `pnpm --filter @zig-wasm/hash test`
- Lint: `pnpm --filter @zig-wasm/hash lint` (fix: `lint:fix`)
- Format: `pnpm --filter @zig-wasm/hash fmt`
- Typecheck: `pnpm --filter @zig-wasm/hash typecheck`

## Implementation hints

- Async APIs lazy-load `hash.wasm`; call `init()` before any `*Sync` helpers.
- Exports many algorithms (crc32, xxhash, wyhash, fnv1a, cityhash, murmur2);
  keep naming consistent and retain `.ts` imports and double quotes.
