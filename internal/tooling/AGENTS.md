# @zig-wasm/tooling – Agent Notes

## Commands

- Test: `pnpm --filter @zig-wasm/tooling test`
- Lint: `pnpm --filter @zig-wasm/tooling lint` (fix: `lint:fix`)
- Format: `pnpm --filter @zig-wasm/tooling fmt`
- Typecheck: `pnpm --filter @zig-wasm/tooling typecheck`
- Maintenance: `pnpm --filter @zig-wasm/tooling check-published`,
  `pnpm --filter @zig-wasm/tooling sync-versions`

## Implementation hints

- Provides shared config exports (`/biome`, `/tsconfig`) and Bun CLI scripts in
  `src/`.
- Keep configs minimal and re-export-friendly; use double quotes and `.ts`
  extensions where applicable.

## Test Coverage

**Total**: 56 tests across 4 test files

### Test Files

- `exports.test.ts` (2 tests): Module and type exports
- `check-published.test.ts` (11 tests): npm registry checks, path resolution,
  error handling
- `sync-versions.test.ts` (12 tests): Version sync between
  package.json/jsr.json, directory scanning
- `configs.test.ts` (31 tests): Config file validation, structure,
  interoperability

### Coverage Areas

- ✅ CLI tool execution and argument parsing
- ✅ Configuration file validation (biome.json, tsconfig.json, package.json)
- ✅ Version synchronization logic
- ✅ npm registry publication checks
- ✅ Path resolution (scoped, relative, absolute)
- ✅ Error handling (missing files, network errors, malformed JSON)
- ✅ Edge cases (pre-release versions, complex scopes)

### Test Approach

- TDD-focused: failing tests first, minimal implementation
- Comprehensive mocking: Bun.file, fetch, fs operations
- Real config validation: reads actual config files
- Integration scenarios: multi-directory scanning, config interoperability

All tests pass with clean lint and typecheck.
