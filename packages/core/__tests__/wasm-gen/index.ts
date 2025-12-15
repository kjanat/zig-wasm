/**
 * WASM test fixture generators.
 *
 * This module provides runtime generation of valid and invalid WASM binaries
 * for testing purposes.
 *
 * @example Valid WASM for testing loading
 * ```ts
 * import { createMinimalWasmWithMemory } from "./wasm-gen";
 *
 * const wasm = createMinimalWasmWithMemory();
 * const instance = await WebAssembly.instantiate(wasm);
 * ```
 *
 * @example Invalid WASM for testing error handling
 * ```ts
 * import { getAllInvalidWasm } from "./wasm-gen";
 *
 * for (const { wasm, reason } of getAllInvalidWasm()) {
 *   await expect(WebAssembly.compile(wasm)).rejects.toThrow();
 * }
 * ```
 *
 * @module
 */

// Valid WASM builders
export {
  createAddFunction,
  createEmptyModule,
  createMinimalWasmWithMemory,
  createWasmThatCallsPanic,
  createWasmWithoutMemory,
  createWasmWithPanicImport,
} from "./builders.ts";

// Invalid WASM builders
export {
  createBadLeb128,
  createBadSectionId,
  createDuplicateSection,
  createEmptyBytes,
  createGarbageBytes,
  createInvalidMagic,
  createInvalidTypeReference,
  createInvalidVersion,
  createMismatchedFunctionCount,
  createSingleByte,
  createTruncatedHeader,
  createTruncatedSection,
  createWrongSectionOrder,
  createZeroSizeSection,
  getAllInvalidWasm,
} from "./invalid.ts";

// Types
export type { InvalidWasm } from "./invalid.ts";
