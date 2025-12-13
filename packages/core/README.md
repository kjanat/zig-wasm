# @zig-wasm/core

Core utilities for Zig WASM packages: environment detection, WASM loading,
memory helpers, and common types.

## Install

- `pnpm add @zig-wasm/core`

## Quick start

```ts
import { AllocationScope, loadWasm } from "@zig-wasm/core";

const { exports, memory } = await loadWasm({ wasmUrl: "/my-module.wasm" });

const result = AllocationScope.use(memory, (scope) => {
  const input = scope.allocAndCopy(new Uint8Array([1, 2, 3]));
  return exports.my_fn(input.ptr, input.len);
});
```

## Key utilities

- `detectEnvironment` / `getEnvironment` – detect Node, Bun, browser.
- `loadWasm` / `createModuleLoader` – fetch/load and instantiate WASM with
  helpful defaults.
- `createWasmModule` – build the lazy-init + sync-access pattern used by other
  packages.
- `AllocationScope`, `WasmMemory` – safe temporary allocations and copies.
- Hex helpers: `toHex`, `fromHex`, `compareBytes`, `concatBytes`.

## Package scripts

- Build: `pnpm --filter @zig-wasm/core build`
- Test: `pnpm --filter @zig-wasm/core test`
- Lint/format: `pnpm --filter @zig-wasm/core lint` /
  `pnpm --filter @zig-wasm/core fmt`
- Typecheck: `pnpm --filter @zig-wasm/core typecheck`
