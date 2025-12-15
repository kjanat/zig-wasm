# AGENTS.md

## Docs

- **Zig**: Pull docs from [ziglang.org/documentation/0.15.2][zig:docs] if you
  need reference for Zig language features.

## Commands

- **Build:** `pnpm build` (full), `pnpm build:zig` (WASM), `pnpm build:ts`
  (TypeScript)
- **Lint:** `pnpm lint` (Biome), `pnpm lint:fix` (auto-fix)
- **Format:** `pnpm fmt` (dprint - TS/JSON/MD/Zig), `pnpm fmt:check` (CI)
- **Test all:** `pnpm test`
- **Test single pkg from the configured vitest projects:**\
  `pnpm test --run [--project <name(as in package.json)>]...`, e.g.\
  `pnpm test --run --project @zig-wasm/core --project @zig-wasm/tooling`.\
  The traditional pnpm --filter doesn't work, as we only have a single config
  file for vitest.\
  See [docs](https://vitest.dev/guide/projects "vitest.dev/guide/projects").
- **Typecheck:** `pnpm typecheck`

## Code Style

- **Formatting:** dprint for all files (requires `zig` compiler zig files);\
  double quotes for strings
- **Linting:** Biome recommended rules; formatter disabled (dprint handles it)
- **Imports:** Use `.ts` extension for relative imports;\
  `import type` for type-only (verbatimModuleSyntax)
- **Types:** Strict mode; `noUncheckedIndexedAccess`, `noImplicitOverride`
- **Naming:** camelCase functions/vars, PascalCase types/classes, UPPER_SNAKE
  constants
- **Errors:** Throw `Error` with descriptive messages;\
  WASM panics convert to JS errors
- **Exports:** Barrel exports via `index.ts`; types in separate `types.ts`
- **WASM pattern:** Lazy-load via `init()`, use `AllocationScope` for memory;\
  sync APIs need `init()` first
- **Async:** Async wrappers auto-init;\
  sync variants (`*Sync`) require explicit `init()`

[zig:docs]: https://ziglang.org/documentation/0.15.2
