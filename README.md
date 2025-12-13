# zig-wasm

Zig standard library modules compiled to WebAssembly for Node.js, bun, deno,
etc. and browsers.

## Packages

| Package              | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `@zig-wasm/core`     | WASM loader, memory utilities, shared types                              |
| `@zig-wasm/crypto`   | Cryptographic hashes (SHA256, SHA512, SHA3, MD5, BLAKE2/3, HMAC)         |
| `@zig-wasm/hash`     | Non-cryptographic hashes (CRC32, Adler32, xxHash, Wyhash, CityHash, FNV) |
| `@zig-wasm/base64`   | Base64 and hex encoding/decoding                                         |
| `@zig-wasm/math`     | Math functions (trig, exp/log, rounding, bit ops)                        |
| `@zig-wasm/compress` | Decompression (XZ, LZMA)                                                 |
| `@zig-wasm/std`      | Umbrella package re-exporting all modules                                |

## Installation

```bash
# Individual packages
npm install @zig-wasm/crypto
npm install @zig-wasm/hash

# Or the umbrella package
npm install @zig-wasm/std
```

## Usage

### Crypto

```ts
import { blake3, hmacSha256, sha256, sha512 } from "@zig-wasm/crypto";

const hash = await sha256("hello world");
const hex = await hashHex("sha256", "hello world");
// b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9

const mac = await hmacSha256("secret-key", "message");
```

### Hash

```ts
import { crc32, xxhash64, wyhash } from '@zig-wasm/hash';

const checksum = await crc32('hello world');
const hash = await xxhash64('data', 0xSEED);
```

### Base64

```ts
import { decode, encode, encodeUrl, hexEncode } from "@zig-wasm/base64";

const encoded = await encode("hello world"); // aGVsbG8gd29ybGQ=
const decoded = await decode(encoded); // Uint8Array

const urlSafe = await encodeUrl("hello world");
const hex = await hexEncode(new Uint8Array([0xde, 0xad])); // dead
```

### Math

```ts
import { clamp, cos, exp, log, sin, sqrt } from "@zig-wasm/math";

const result = await sin(Math.PI / 2);
const clamped = await clamp(150, 0, 100); // 100
```

### Compress

```ts
import { decompressLzma, decompressXz } from "@zig-wasm/compress";

const decompressed = await decompressXz(compressedData);
```

### Umbrella Package

```ts
import { base64, crypto, hash } from "@zig-wasm/std";

const sha = await crypto.sha256("hello");
const crc = await hash.crc32("hello");
const b64 = await base64.encode("hello");
```

## Building from Source

Requirements:

- Zig 0.15.2+
- Node.js 18+
- pnpm

```bash
# Install dependencies
pnpm install

# Build everything (Zig WASM + TypeScript)
pnpm build

# Build Zig WASM only
pnpm build:zig

# Build TypeScript only
pnpm build:ts
```

## Project Structure

```tree
zig-wasm/
  build.zig              # Zig build configuration
  zig/src/
    allocator.zig        # Shared WASM allocator
    crypto.zig           # Crypto hash exports
    hash.zig             # Non-crypto hash exports
    base64.zig           # Base64/hex exports
    math.zig             # Math exports
    compress.zig         # Compression exports
  packages/
    core/                # @zig-wasm/core
    crypto/              # @zig-wasm/crypto
    hash/                # @zig-wasm/hash
    base64/              # @zig-wasm/base64
    math/                # @zig-wasm/math
    compress/            # @zig-wasm/compress
    std/                 # @zig-wasm/std
```

## API Reference

### @zig-wasm/crypto

**Hash functions:**

- `md5(data)` - MD5 (128-bit)
- `sha1(data)` - SHA-1 (160-bit)
- `sha256(data)` - SHA-256 (256-bit)
- `sha384(data)` - SHA-384 (384-bit)
- `sha512(data)` - SHA-512 (512-bit)
- `sha3_256(data)` - SHA3-256 (256-bit)
- `sha3_512(data)` - SHA3-512 (512-bit)
- `blake2b256(data)` - BLAKE2b-256 (256-bit)
- `blake2s256(data)` - BLAKE2s-256 (256-bit)
- `blake3(data)` - BLAKE3 (256-bit)

**HMAC:**

- `hmacSha256(key, data)` - HMAC-SHA256
- `hmacSha512(key, data)` - HMAC-SHA512

**Generic:**

- `hash(algorithm, data)` - Hash with any algorithm
- `hashHex(algorithm, data)` - Hash and return hex string

### @zig-wasm/hash

- `crc32(data)` - CRC32 checksum
- `adler32(data)` - Adler-32 checksum
- `xxhash32(data, seed?)` - xxHash 32-bit
- `xxhash64(data, seed?)` - xxHash 64-bit
- `wyhash(data, seed?)` - wyhash
- `cityhash64(data, seed?)` - CityHash 64-bit
- `murmur2_64(data, seed?)` - MurmurHash2 64-bit
- `fnv1a32(data)` - FNV-1a 32-bit
- `fnv1a64(data)` - FNV-1a 64-bit

### @zig-wasm/base64

- `encode(data)` / `decode(str)` - Standard Base64
- `encodeNoPadding(data)` / `decodeNoPadding(str)` - No padding
- `encodeUrl(data)` / `decodeUrl(str)` - URL-safe
- `encodeUrlNoPadding(data)` / `decodeUrlNoPadding(str)` - URL-safe, no padding
- `hexEncode(data)` / `hexDecode(str)` - Hex encoding

### @zig-wasm/math

**Trigonometry:** `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`\
**Hyperbolic:** `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`\
**Exponential:** `exp`, `exp2`, `expm1`, `log`, `log2`, `log10`, `log1p`\
**Power:** `sqrt`, `cbrt`, `pow`, `hypot` **Rounding:** `floor`, `ceil`,
`round`, `trunc` **Utility:** `abs`, `min`, `max`, `clamp`, `sign`, `copysign`\
**Bit ops:** `clz`, `ctz`, `popcount`, `bswap`, `rotl`, `rotr` **Constants:**
`pi()`, `e()`, `ln2()`, `ln10()`

### @zig-wasm/compress

- `decompressXz(data)` - Decompress XZ/LZMA2 data
- `decompressLzma(data)` - Decompress LZMA data

## License

[MIT][license]

<!--link-definitions-->

[@zig-wasm/base64]: https://www.npmjs.com/package/@zig-wasm/base64
[@zig-wasm/compress]: https://www.npmjs.com/package/@zig-wasm/compress
[@zig-wasm/core]: https://www.npmjs.com/package/@zig-wasm/core
[@zig-wasm/crypto]: https://www.npmjs.com/package/@zig-wasm/crypto
[@zig-wasm/hash]: https://www.npmjs.com/package/@zig-wasm/hash
[@zig-wasm/math]: https://www.npmjs.com/package/@zig-wasm/math
[@zig-wasm/std]: https://www.npmjs.com/package/@zig-wasm/std
[biome]: https://biomejs.dev/
[bun]: https://bun.sh/
[deno]: https://deno.land/
[dprint]: https://dprint.dev/
[license]: https://github.com/kjanat/zig-wasm/blob/master/LICENSE
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[pnpm]: https://pnpm.io/
[wasm]: https://webassembly.org/
[zig]: https://ziglang.org/

<!--end-of-link-definitions-->

<!--markdownlint-disable-file MD053-->
