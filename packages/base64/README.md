# @zig-wasm/base64

Base64 and hex encoding/decoding powered by Zig via WebAssembly.

## Install

- `pnpm add @zig-wasm/base64`

## Quick start

```ts
import { decode, encode } from "@zig-wasm/base64";

const encoded = await encode("hello");
const bytes = await decode(encoded); // Uint8Array -> TextDecoder if needed
```

Sync helpers require an explicit init:

```ts
import { encodeSync, init } from "@zig-wasm/base64";

await init(); // idempotent
const encoded = encodeSync("hello");
```

## WASM loading options

- Automatic: async APIs lazy-load `base64.wasm`.
- Manual: `init({ wasmUrl | wasmPath | wasmBytes, imports })`.
- In Node/Bun, the default loader resolves the packaged `dist/base64.wasm`; in
  browsers a relative URL next to the module is used.

## Package scripts

- Build: `pnpm --filter @zig-wasm/base64 build`
- Test: `pnpm --filter @zig-wasm/base64 test`
- Lint/format: `pnpm --filter @zig-wasm/base64 lint` /
  `pnpm --filter @zig-wasm/base64 fmt`
- Typecheck: `pnpm --filter @zig-wasm/base64 typecheck`
