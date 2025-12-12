# AGENTS.md

## Commands
- **Build:** `pnpm build` (full), `pnpm build:zig`, `pnpm build:ts`
- **Lint:** `pnpm lint` (biome), `pnpm lint:fix`
- **Format:** `pnpm fmt` (dprint)
- **Test all:** `pnpm test`
- **Test single pkg:** `pnpm --filter @zig-wasm/crypto test`
- **Typecheck:** `pnpm typecheck`

## Code Style
- **Formatting:** dprint handles all formatting; double quotes for strings
- **Linting:** Biome with recommended rules (formatter disabled)
- **Imports:** Use `.ts` extension for relative imports; `import type` for type-only
- **Types:** Strict mode enabled; `noUncheckedIndexedAccess`, `verbatimModuleSyntax`
- **Naming:** camelCase functions/vars, PascalCase types/classes, UPPER_SNAKE constants
- **Errors:** Throw `Error` with descriptive messages; WASM panics convert to JS errors
- **Exports:** Barrel exports via `index.ts`; types in separate `types.ts`
- **WASM pattern:** Lazy-load module, use `AllocationScope` for memory management
- **Async:** All WASM wrapper functions are async (module loading)
