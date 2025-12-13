# @zig-wasm/core – Agent Notes

## Commands

- Build: `pnpm --filter @zig-wasm/core build`
- Test: `pnpm --filter @zig-wasm/core test`
- Lint: `pnpm --filter @zig-wasm/core lint` (fix: `lint:fix`)
- Format: `pnpm --filter @zig-wasm/core fmt`
- Typecheck: `pnpm --filter @zig-wasm/core typecheck`

## Implementation hints

- Provides environment detection, WASM loading, and memory helpers used by other
  packages.
- Favor `createWasmModule` + `AllocationScope` patterns; keep `.ts` extensions
  and double quotes.
