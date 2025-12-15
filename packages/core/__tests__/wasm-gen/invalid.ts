/**
 * Invalid WASM module builders for error handling tests.
 *
 * Each function generates an intentionally malformed WASM binary
 * that should be rejected by WebAssembly.compile/instantiate.
 *
 * @module
 */

import { WASM_HEADER, WASM_MAGIC, WASM_VERSION } from "@zig-wasm/core";

/**
 * Describes an invalid WASM binary with its expected failure reason.
 */
export interface InvalidWasm {
  /** The malformed WASM bytes */
  wasm: Uint8Array;
  /** Human-readable description of why it's invalid */
  reason: string;
}

/**
 * Creates WASM with wrong magic number.
 *
 * Valid magic is `\0asm` (0x00 0x61 0x73 0x6d).
 * This uses `\0\0\0\0` instead.
 */
export function createInvalidMagic(): InvalidWasm {
  return {
    wasm: new Uint8Array([0x00, 0x00, 0x00, 0x00, ...WASM_VERSION]),
    reason: "invalid magic number",
  };
}

/**
 * Creates WASM with unsupported version number.
 *
 * Valid version is 1 (0x01 0x00 0x00 0x00).
 * This uses version 99.
 */
export function createInvalidVersion(): InvalidWasm {
  return {
    wasm: new Uint8Array([...WASM_MAGIC, 0x63, 0x00, 0x00, 0x00]),
    reason: "unsupported version (99)",
  };
}

/**
 * Creates truncated WASM with only magic, no version.
 *
 * Valid WASM requires 8-byte header (4 magic + 4 version).
 */
export function createTruncatedHeader(): InvalidWasm {
  return {
    wasm: new Uint8Array(WASM_MAGIC),
    reason: "truncated header (missing version)",
  };
}

/**
 * Creates WASM with a section that claims more bytes than available.
 *
 * Declares a type section with size 100 bytes but only provides 5.
 */
export function createTruncatedSection(): InvalidWasm {
  return {
    wasm: new Uint8Array([
      ...WASM_HEADER,
      0x01, // section id: type
      0x64, // size: 100 bytes (lie!)
      0x01, // 1 type (start of actual content)
      0x60, // func type
      0x00, // 0 params - section ends here, missing promised bytes
    ]),
    reason: "truncated section (declared 100 bytes, only has 3)",
  };
}

/**
 * Creates completely random garbage bytes (not WASM at all).
 *
 * No valid header, no structure.
 */
export function createGarbageBytes(): InvalidWasm {
  return {
    wasm: new Uint8Array([0x00, 0x01, 0x02, 0x03]),
    reason: "garbage bytes (not WASM)",
  };
}

/**
 * Creates WASM with an unknown section ID.
 *
 * Valid section IDs are 0-12. This uses ID 99.
 */
export function createBadSectionId(): InvalidWasm {
  return {
    wasm: new Uint8Array([
      ...WASM_HEADER,
      0x63, // section id: 99 (invalid)
      0x01, // size: 1 byte
      0x00, // content
    ]),
    reason: "unknown section ID (99)",
  };
}

/**
 * Creates WASM with malformed LEB128 in section size.
 *
 * LEB128 continuation bit (0x80) set on all bytes with no terminator.
 */
export function createBadLeb128(): InvalidWasm {
  return {
    wasm: new Uint8Array([
      ...WASM_HEADER,
      0x01, // section id: type
      0x80,
      0x80,
      0x80,
      0x80,
      0x80, // unterminated LEB128
    ]),
    reason: "malformed LEB128 (unterminated)",
  };
}

/**
 * Creates WASM with section size of zero but non-empty expected content.
 *
 * Type section with size 0 is technically valid (empty), but this
 * has bytes after that don't belong to any section.
 */
export function createZeroSizeSection(): InvalidWasm {
  return {
    wasm: new Uint8Array([
      ...WASM_HEADER,
      0x01, // section id: type
      0x00, // size: 0 bytes
      // Now the parser expects next section or EOF
      // But let's put garbage that looks like incomplete data
      0x60, // this byte is orphaned
    ]),
    reason: "orphaned bytes after zero-size section",
  };
}

/**
 * Creates WASM with duplicate section (two type sections).
 *
 * Most sections can only appear once.
 */
export function createDuplicateSection(): InvalidWasm {
  return {
    wasm: new Uint8Array([
      ...WASM_HEADER,
      // First type section
      0x01, // section id: type
      0x04, // size: 4 bytes
      0x01,
      0x60,
      0x00,
      0x00, // 1 type: () -> ()
      // Second type section (invalid!)
      0x01, // section id: type (duplicate)
      0x04, // size: 4 bytes
      0x01,
      0x60,
      0x00,
      0x00, // 1 type: () -> ()
    ]),
    reason: "duplicate type section",
  };
}

/**
 * Creates WASM with sections in wrong order.
 *
 * Sections must appear in order by ID (type=1 before function=3, etc).
 * This puts function section before type section.
 */
export function createWrongSectionOrder(): InvalidWasm {
  return {
    wasm: new Uint8Array([
      ...WASM_HEADER,
      // Function section first (should come after type)
      0x03, // section id: function
      0x02, // size: 2 bytes
      0x01,
      0x00, // 1 function, type index 0
      // Type section second (wrong order!)
      0x01, // section id: type
      0x04, // size: 4 bytes
      0x01,
      0x60,
      0x00,
      0x00, // 1 type: () -> ()
    ]),
    reason: "sections in wrong order (function before type)",
  };
}

/**
 * Creates WASM with function referencing non-existent type.
 *
 * Function section references type index 5, but only 1 type exists.
 */
export function createInvalidTypeReference(): InvalidWasm {
  return {
    wasm: new Uint8Array([
      ...WASM_HEADER,
      // Type section: 1 type
      0x01, // section id: type
      0x04, // size: 4 bytes
      0x01,
      0x60,
      0x00,
      0x00, // 1 type: () -> ()
      // Function section: references type 5 (doesn't exist!)
      0x03, // section id: function
      0x02, // size: 2 bytes
      0x01,
      0x05, // 1 function, type index 5 (invalid)
    ]),
    reason: "function references non-existent type index",
  };
}

/**
 * Creates WASM with mismatched function count.
 *
 * Function section declares 2 functions, code section has 1 body.
 */
export function createMismatchedFunctionCount(): InvalidWasm {
  return {
    wasm: new Uint8Array([
      ...WASM_HEADER,
      // Type section
      0x01,
      0x04,
      0x01,
      0x60,
      0x00,
      0x00, // 1 type: () -> ()
      // Function section: 2 functions
      0x03,
      0x03,
      0x02,
      0x00,
      0x00, // 2 functions, both type 0
      // Code section: only 1 body!
      0x0a, // section id: code
      0x04, // size: 4 bytes
      0x01, // 1 function body (should be 2!)
      0x02,
      0x00,
      0x0b, // body: size 2, 0 locals, end
    ]),
    reason: "function count mismatch (declared 2, code has 1)",
  };
}

/**
 * Creates empty bytes (zero length).
 */
export function createEmptyBytes(): InvalidWasm {
  return {
    wasm: new Uint8Array([]),
    reason: "empty bytes (no data)",
  };
}

/**
 * Creates WASM with only 1 byte.
 */
export function createSingleByte(): InvalidWasm {
  return {
    wasm: new Uint8Array([0x00]),
    reason: "single byte (incomplete header)",
  };
}

/**
 * Get all invalid WASM variants for comprehensive error testing.
 *
 * @returns Array of all invalid WASM test cases
 */
export function getAllInvalidWasm(): InvalidWasm[] {
  return [
    createInvalidMagic(),
    createInvalidVersion(),
    createTruncatedHeader(),
    createTruncatedSection(),
    createGarbageBytes(),
    createBadSectionId(),
    createBadLeb128(),
    createZeroSizeSection(),
    createDuplicateSection(),
    createWrongSectionOrder(),
    createInvalidTypeReference(),
    createMismatchedFunctionCount(),
    createEmptyBytes(),
    createSingleByte(),
  ];
}
