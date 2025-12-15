/**
 * WebAssembly binary format utilities.
 *
 * This module provides constants, enums, and helper functions for working with
 * the WebAssembly binary format (`.wasm` files). Useful for parsing, generating,
 * or validating WASM modules.
 *
 * @example Building a WASM section
 * ```ts
 * import { Section, encodeSection, encodeVec, encodeString } from "@zig-wasm/core";
 *
 * // Build an export section with one export
 * const exportEntry = [...encodeString("memory"), ExportKind.Memory, 0];
 * const exportSection = encodeSection(Section.Export, encodeVec([exportEntry]));
 * ```
 *
 * @example Validating WASM header
 * ```ts
 * import { isValidWasmHeader } from "@zig-wasm/core";
 *
 * const bytes = await fetch("module.wasm").then(r => r.arrayBuffer());
 * if (!isValidWasmHeader(new Uint8Array(bytes))) {
 *   throw new Error("Invalid WASM file");
 * }
 * ```
 *
 * @module
 */

import { decodeUleb128, encodeUleb128 } from "./leb128.ts";

// =============================================================================
// Constants
// =============================================================================

/**
 * WebAssembly magic number: `\0asm` (0x00 0x61 0x73 0x6d)
 */
export const WASM_MAGIC: readonly number[] = [0x00, 0x61, 0x73, 0x6d] as const;

/**
 * WebAssembly version 1: (0x01 0x00 0x00 0x00)
 */
export const WASM_VERSION: readonly number[] = [0x01, 0x00, 0x00, 0x00] as const;

/**
 * Combined WASM header (magic + version)
 */
export const WASM_HEADER: readonly number[] = [...WASM_MAGIC, ...WASM_VERSION] as const;

// =============================================================================
// Enums
// =============================================================================

/**
 * WebAssembly section IDs.
 *
 * @see https://webassembly.github.io/spec/core/binary/modules.html#sections
 */
export enum Section {
  /** Custom section (id=0) - name + arbitrary bytes */
  Custom = 0,
  /** Type section (id=1) - function signatures */
  Type = 1,
  /** Import section (id=2) - external imports */
  Import = 2,
  /** Function section (id=3) - function type indices */
  Function = 3,
  /** Table section (id=4) - table definitions */
  Table = 4,
  /** Memory section (id=5) - memory definitions */
  Memory = 5,
  /** Global section (id=6) - global variables */
  Global = 6,
  /** Export section (id=7) - exported items */
  Export = 7,
  /** Start section (id=8) - start function index */
  Start = 8,
  /** Element section (id=9) - table element segments */
  Element = 9,
  /** Code section (id=10) - function bodies */
  Code = 10,
  /** Data section (id=11) - data segments */
  Data = 11,
  /** Data count section (id=12) - number of data segments */
  DataCount = 12,
}

/**
 * WebAssembly value types.
 *
 * @see https://webassembly.github.io/spec/core/binary/types.html#value-types
 */
export enum ValType {
  /** 32-bit integer */
  I32 = 0x7f,
  /** 64-bit integer */
  I64 = 0x7e,
  /** 32-bit float */
  F32 = 0x7d,
  /** 64-bit float */
  F64 = 0x7c,
  /** 128-bit vector (SIMD) */
  V128 = 0x7b,
  /** Function reference */
  FuncRef = 0x70,
  /** External reference */
  ExternRef = 0x6f,
}

/**
 * Type constructor for function types.
 */
export enum TypeConstructor {
  /** Function type (0x60) */
  Func = 0x60,
}

/**
 * WebAssembly opcodes (subset commonly used).
 *
 * @see https://webassembly.github.io/spec/core/binary/instructions.html
 */
export enum Op {
  /** Unreachable trap */
  Unreachable = 0x00,
  /** No operation */
  Nop = 0x01,
  /** End of block/function */
  End = 0x0b,
  /** Return from function */
  Return = 0x0f,
  /** Call function by index */
  Call = 0x10,
  /** Drop top of stack */
  Drop = 0x1a,
  /** i32 constant */
  I32Const = 0x41,
  /** i64 constant */
  I64Const = 0x42,
  /** f32 constant */
  F32Const = 0x43,
  /** f64 constant */
  F64Const = 0x44,
}

/**
 * Export descriptor kinds.
 *
 * @see https://webassembly.github.io/spec/core/binary/modules.html#export-section
 */
export enum ExportKind {
  /** Function export */
  Func = 0x00,
  /** Table export */
  Table = 0x01,
  /** Memory export */
  Memory = 0x02,
  /** Global export */
  Global = 0x03,
}

/**
 * Import descriptor kinds.
 *
 * @see https://webassembly.github.io/spec/core/binary/modules.html#import-section
 */
export enum ImportKind {
  /** Function import */
  Func = 0x00,
  /** Table import */
  Table = 0x01,
  /** Memory import */
  Memory = 0x02,
  /** Global import */
  Global = 0x03,
}

// =============================================================================
// Encoding Helpers
// =============================================================================

/**
 * Encode a UTF-8 string as WASM format (length-prefixed).
 *
 * @param s - String to encode
 * @returns Bytes: [length as uleb128, ...utf8 bytes]
 *
 * @example
 * ```ts
 * encodeString("env");     // [3, 0x65, 0x6e, 0x76]
 * encodeString("memory");  // [6, 0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79]
 * ```
 */
export function encodeString(s: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(s);
  return [...encodeUleb128(bytes.length), ...bytes];
}

/**
 * Encode a WASM section (section id + length-prefixed content).
 *
 * @param sectionId - Section ID from {@link Section} enum
 * @param content - Section content bytes
 * @returns Complete section bytes
 *
 * @example
 * ```ts
 * // Memory section with 1 memory of 1 page
 * const content = [1, 0x00, 1]; // 1 memory, no-max flag, 1 page
 * const section = encodeSection(Section.Memory, content);
 * // [5, 3, 1, 0, 1] - section id, size, content
 * ```
 */
export function encodeSection(sectionId: Section, content: number[]): number[] {
  return [sectionId, ...encodeUleb128(content.length), ...content];
}

/**
 * Encode a vector (array) of items.
 *
 * @param items - Array of byte arrays, each representing one item
 * @returns Bytes: [count as uleb128, ...flattened items]
 *
 * @example
 * ```ts
 * // Vector of two exports
 * const exports = [
 *   [...encodeString("memory"), ExportKind.Memory, 0],
 *   [...encodeString("add"), ExportKind.Func, 0],
 * ];
 * encodeVec(exports); // [2, ...export1, ...export2]
 * ```
 */
export function encodeVec(items: number[][]): number[] {
  const flat: number[] = [];
  for (const item of items) {
    flat.push(...item);
  }
  return [...encodeUleb128(items.length), ...flat];
}

/**
 * Encode a function type signature.
 *
 * @param params - Parameter value types
 * @param results - Result value types
 * @returns Function type encoding
 *
 * @example
 * ```ts
 * // (i32, i32) -> i32
 * encodeFuncType([ValType.I32, ValType.I32], [ValType.I32]);
 * // [0x60, 2, 0x7f, 0x7f, 1, 0x7f]
 *
 * // () -> void
 * encodeFuncType([], []);
 * // [0x60, 0, 0]
 * ```
 */
export function encodeFuncType(params: ValType[], results: ValType[]): number[] {
  return [
    TypeConstructor.Func,
    ...encodeUleb128(params.length),
    ...params,
    ...encodeUleb128(results.length),
    ...results,
  ];
}

/**
 * Encode a limits structure (used for memory/table).
 *
 * @param min - Minimum size (pages for memory, entries for table)
 * @param max - Maximum size (optional)
 * @returns Limits encoding
 *
 * @example
 * ```ts
 * encodeLimits(1);        // [0x00, 1] - min 1, no max
 * encodeLimits(1, 10);    // [0x01, 1, 10] - min 1, max 10
 * ```
 */
export function encodeLimits(min: number, max?: number): number[] {
  if (max !== undefined) {
    return [0x01, ...encodeUleb128(min), ...encodeUleb128(max)];
  }
  return [0x00, ...encodeUleb128(min)];
}

// =============================================================================
// Validation / Parsing
// =============================================================================

/**
 * Information about a parsed WASM section.
 */
export interface ParsedSection {
  /** Byte offset where section starts (at section ID) */
  offset: number;
  /** Content size (excluding section ID and size bytes) */
  contentSize: number;
  /** Total size including section ID and size bytes */
  totalSize: number;
}

/**
 * Check if data starts with a valid WASM header.
 *
 * @param data - Bytes to check
 * @returns true if starts with magic number and version 1
 *
 * @example
 * ```ts
 * isValidWasmHeader(new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0])); // true
 * isValidWasmHeader(new Uint8Array([0, 0, 0, 0])); // false
 * ```
 */
export function isValidWasmHeader(data: ArrayLike<number>): boolean {
  if (data.length < 8) return false;

  // Check magic
  for (let i = 0; i < 4; i++) {
    if (data[i] !== WASM_MAGIC[i]) return false;
  }

  // Check version
  for (let i = 0; i < 4; i++) {
    if (data[i + 4] !== WASM_VERSION[i]) return false;
  }

  return true;
}

/**
 * Parse sections from a WASM binary.
 *
 * @param data - Complete WASM binary
 * @returns Map of section ID to parsed section info
 * @throws {Error} If header is invalid
 * @throws {RangeError} If section header is incomplete or section extends beyond data bounds
 *
 * @example
 * ```ts
 * const sections = parseWasmSections(wasmBytes);
 * const exportSection = sections.get(Section.Export);
 * if (exportSection) {
 *   console.log(`Export section at offset ${exportSection.offset}`);
 * }
 * ```
 */
export function parseWasmSections(data: ArrayLike<number>): Map<Section, ParsedSection> {
  if (!isValidWasmHeader(data)) {
    throw new Error("Invalid WASM header");
  }

  const sections = new Map<Section, ParsedSection>();
  let pos = 8; // After header

  while (pos < data.length) {
    // Validate section ID byte is accessible (always true here due to loop condition,
    // but explicit for clarity)
    if (pos >= data.length) {
      throw new RangeError(`Unexpected end of data at position ${pos}`);
    }

    const sectionId = data[pos] as Section;

    // Validate at least one byte exists for ULEB128 size
    if (pos + 1 >= data.length) {
      throw new RangeError(`Incomplete section header at position ${pos}`);
    }

    // decodeUleb128 will throw RangeError if ULEB128 is truncated or overflows
    const [contentSize, sizeBytes] = decodeUleb128(data, pos + 1);
    const totalSize = 1 + sizeBytes + contentSize;

    // Validate section content fits within data bounds
    if (pos + totalSize > data.length) {
      throw new RangeError(
        `Section ${sectionId} extends beyond data bounds: `
          + `expected ${totalSize} bytes at position ${pos}, but only ${data.length - pos} bytes remain`,
      );
    }

    sections.set(sectionId, {
      offset: pos,
      contentSize,
      totalSize,
    });

    pos += totalSize;
  }

  return sections;
}

/**
 * Names for section IDs (for debugging/display).
 */
export const SECTION_NAMES: Readonly<Record<Section, string>> = {
  [Section.Custom]: "custom",
  [Section.Type]: "type",
  [Section.Import]: "import",
  [Section.Function]: "function",
  [Section.Table]: "table",
  [Section.Memory]: "memory",
  [Section.Global]: "global",
  [Section.Export]: "export",
  [Section.Start]: "start",
  [Section.Element]: "element",
  [Section.Code]: "code",
  [Section.Data]: "data",
  [Section.DataCount]: "datacount",
} as const;
