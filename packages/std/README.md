# @zig-wasm/std

Zig standard library for JavaScript via WebAssembly. Umbrella package that
re-exports the other `@zig-wasm/*` modules for convenience.

## Install

- `pnpm add @zig-wasm/std`

## Quick start

```ts
// Grab everything as a namespace
import * as std from "@zig-wasm/std";

const digest = await std.crypto.sha256("data");
const encoded = await std.base64.encode("hello");
const crc = await std.hash.crc32Hex("payload");
```

Tree-shakeable imports:

```ts
import { sha256 } from "@zig-wasm/std/crypto";
import { crc32 } from "@zig-wasm/std/hash";
```

If you prefer slimmer bundles, depend on the individual packages directly (e.g.
`@zig-wasm/crypto`).

## WASM loading

- Each submodule lazily loads its own WASM artifact (`base64.wasm`,
  `crypto.wasm`, etc.).
- Sync APIs still require `await std.crypto.init()` / `await std.base64.init()`
  before calling `*Sync`.

## Package scripts

- Build: `pnpm --filter @zig-wasm/std build`
- Test: `pnpm --filter @zig-wasm/std test`
- Lint/format: `pnpm --filter @zig-wasm/std lint` /
  `pnpm --filter @zig-wasm/std fmt`
- Typecheck: `pnpm --filter @zig-wasm/std typecheck`
