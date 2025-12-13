# @zig-wasm/hash

Fast non-cryptographic hash functions powered by Zig via WebAssembly.

## Install

- `pnpm add @zig-wasm/hash`

## Quick start

```ts
import { crc32Hex, wyhash, xxhash64 } from "@zig-wasm/hash";

const crc = await crc32Hex("payload");
const xxh = await xxhash64(new Uint8Array([1, 2, 3]));
const wy = await wyhash("payload"); // Uint8Array digest
```

Call `await init()` before using any `*Sync` helpers (`crc32Sync`, `hashSync`,
etc.).

## Algorithms

- Checksums: `crc32`, `adler32`
- General-purpose: `xxhash32/64`, `wyhash`, `fnv1a32/64`, `murmur2_64`,
  `cityhash64`
- Generic helpers: `hash`, `hashHex`, `hash32`, `hash64` with `HashAlgorithm`
  types

See `src/index.ts` for the full async and sync exports.

## WASM loading options

- Async APIs lazy-load `hash.wasm`.
- Override with `init({ wasmUrl | wasmPath | wasmBytes, imports })` when
  self-hosting.

## Package scripts

- Build: `pnpm --filter @zig-wasm/hash build`
- Test: `pnpm --filter @zig-wasm/hash test`
- Lint/format: `pnpm --filter @zig-wasm/hash lint` /
  `pnpm --filter @zig-wasm/hash fmt`
- Typecheck: `pnpm --filter @zig-wasm/hash typecheck`
