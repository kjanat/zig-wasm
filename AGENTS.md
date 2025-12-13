# AGENTS.md

## Commands

- **Build:** `pnpm build` (full), `pnpm build:zig` (WASM), `pnpm build:ts`
  (TypeScript)
- **Lint:** `pnpm lint` (Biome), `pnpm lint:fix` (auto-fix)
- **Format:** `pnpm fmt` (dprint - TS/JSON/MD/Zig), `pnpm fmt:check` (CI)
- **Test all:** `pnpm test`
- **Test single pkg:** `pnpm --filter @zig-wasm/crypto test`
- **Typecheck:** `pnpm typecheck`

## Code Style

- **Formatting:** dprint for all files (incl. `zig fmt`); double quotes for
  strings
- **Linting:** Biome recommended rules; formatter disabled (dprint handles it)
- **Imports:** Use `.ts` extension for relative imports; `import type` for
  type-only (verbatimModuleSyntax)
- **Types:** Strict mode; `noUncheckedIndexedAccess`, `noImplicitOverride`
- **Naming:** camelCase functions/vars, PascalCase types/classes, UPPER_SNAKE
  constants
- **Errors:** Throw `Error` with descriptive messages; WASM panics convert to JS
  errors
- **Exports:** Barrel exports via `index.ts`; types in separate `types.ts`
- **WASM pattern:** Lazy-load via `init()`, use `AllocationScope` for memory;
  sync APIs need `init()` first
- **Async:** Async wrappers auto-init; sync variants (`*Sync`) require explicit
  `init()`
