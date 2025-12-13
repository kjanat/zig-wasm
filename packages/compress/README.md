# @zig-wasm/compress

XZ and LZMA decompression powered by Zig's `std.compress` via WebAssembly.

## Install

- `pnpm add @zig-wasm/compress`

## Quick start

```ts
import { decompressLzma, decompressXz } from "@zig-wasm/compress";

const data = await decompressXz(compressedUint8Array);
// data is a Uint8Array containing the decompressed bytes
```

Sync helpers require manual initialization:

```ts
import { decompressXzSync, init } from "@zig-wasm/compress";

await init();
const data = decompressXzSync(compressedUint8Array);
```

## WASM loading options

- Async APIs lazy-load `compress.wasm`.
- Override with `init({ wasmUrl | wasmPath | wasmBytes, imports })` when
  bundling or self-hosting.

## Package scripts

- Build: `pnpm --filter @zig-wasm/compress build`
- Test: `pnpm --filter @zig-wasm/compress test`
- Lint/format: `pnpm --filter @zig-wasm/compress lint` /
  `pnpm --filter @zig-wasm/compress fmt`
- Typecheck: `pnpm --filter @zig-wasm/compress typecheck`
