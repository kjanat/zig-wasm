# @zig-wasm/tooling

Shared Biome config, TypeScript config, and maintenance scripts for the Zig-Wasm
workspace.

## Install

- `pnpm add -D @zig-wasm/tooling`

## What's inside

- Config exports: `@zig-wasm/tooling/biome`, `@zig-wasm/tooling/tsconfig`.
- CLI scripts (Bun): `check-published` (verify published versions),
  `sync-versions` (align workspace versions).
- Source helpers live in `src/` and are published with the package for reuse.

## Usage

```jsonc
// biome.jsonc
{ "extends": ["@zig-wasm/tooling/biome"] }
```

```jsonc
// tsconfig.json
{ "extends": "@zig-wasm/tooling/tsconfig" }
```

```sh
pnpm tooling:check-published   # via workspace script alias
pnpm tooling:sync-versions
```

## Package scripts

- Lint/format: `pnpm --filter @zig-wasm/tooling lint` /
  `pnpm --filter @zig-wasm/tooling fmt`
- Typecheck: `pnpm --filter @zig-wasm/tooling typecheck`
- Maintenance: `pnpm --filter @zig-wasm/tooling check-published` /
  `pnpm --filter @zig-wasm/tooling sync-versions`
