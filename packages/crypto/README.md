# @zig-wasm/crypto

Cryptographic hash functions powered by Zig's `std.crypto` via WebAssembly.

## Install

- `pnpm add @zig-wasm/crypto`

## Quick start

```ts
import { hashHex, hmacSha256, sha256 } from "@zig-wasm/crypto";

const digest = await sha256("hello world"); // Uint8Array
const digestHex = await hashHex("blake3", "data"); // hex string
const mac = await hmacSha256("secret", "payload"); // Uint8Array
```

Sync helpers require `await init()` first, then use `sha256Sync`, `hashHexSync`,
etc.

## Available algorithms

- SHA1, SHA2 (256/384/512), SHA3 (256/512), MD5
- BLAKE2b-256, BLAKE2s-256, BLAKE3
- HMAC (generic), `hmacSha256`, `hmacSha512`
- Generic `hash` / `hashHex` with `HashAlgorithm` and `getHashDigestLength`

See `src/index.ts` for the full async and sync export lists.

## WASM loading options

- Async APIs lazy-load `crypto.wasm`.
- Configure with `init({ wasmUrl | wasmPath | wasmBytes, imports })` for custom
  hosting.

## Package scripts

- Build: `pnpm --filter @zig-wasm/crypto build`
- Test: `pnpm --filter @zig-wasm/crypto test`
- Lint/format: `pnpm --filter @zig-wasm/crypto lint` /
  `pnpm --filter @zig-wasm/crypto fmt`
- Typecheck: `pnpm --filter @zig-wasm/crypto typecheck`
