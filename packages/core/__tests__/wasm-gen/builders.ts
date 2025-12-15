/**
 * Valid WASM module builders for testing.
 *
 * Each function generates a valid WASM module at runtime using the
 * encoding utilities from `@zig-wasm/core`.
 *
 * @module
 */

import {
  encodeFuncType,
  encodeLimits,
  encodeSection,
  encodeSleb128,
  encodeString,
  encodeUleb128,
  encodeVec,
  ExportKind,
  ImportKind,
  Op,
  Section,
  ValType,
  WASM_HEADER,
} from "@zig-wasm/core";

/**
 * Creates a minimal valid WASM module that exports memory.
 *
 * Structure:
 * - Memory section: 1 page (64KB)
 * - Export section: exports memory as "memory"
 *
 * @returns Valid WASM module bytes
 */
export function createMinimalWasmWithMemory(): Uint8Array {
  const memorySec = encodeSection(Section.Memory, encodeVec([encodeLimits(1)]));

  const exportSec = encodeSection(
    Section.Export,
    encodeVec([[...encodeString("memory"), ExportKind.Memory, 0]]),
  );

  return new Uint8Array([...WASM_HEADER, ...memorySec, ...exportSec]);
}

/**
 * Creates a minimal valid WASM module WITHOUT memory export.
 *
 * Structure:
 * - Type section: () -> i32
 * - Function section: 1 function of type 0
 * - Export section: exports function as "test"
 * - Code section: returns i32.const 42
 *
 * @returns Valid WASM module bytes (no memory)
 */
export function createWasmWithoutMemory(): Uint8Array {
  // Type section: () -> i32
  const typeSec = encodeSection(Section.Type, encodeVec([encodeFuncType([], [ValType.I32])]));

  // Function section: 1 function using type 0
  const funcSec = encodeSection(Section.Function, [...encodeUleb128(1), 0]);

  // Export section: export function 0 as "test"
  const exportSec = encodeSection(
    Section.Export,
    encodeVec([[...encodeString("test"), ExportKind.Func, 0]]),
  );

  // Code section: function body that returns 42
  const body = [
    0, // 0 local declarations
    Op.I32Const,
    ...encodeSleb128(42),
    Op.End,
  ];
  const codeSec = encodeSection(Section.Code, encodeVec([[...encodeUleb128(body.length), ...body]]));

  return new Uint8Array([...WASM_HEADER, ...typeSec, ...funcSec, ...exportSec, ...codeSec]);
}

/**
 * Creates a WASM module with memory that imports _panic from env.
 *
 * Structure:
 * - Type section: (i32, i32) -> void
 * - Import section: env._panic function
 * - Memory section: 1 page
 * - Export section: exports memory as "memory"
 *
 * @returns Valid WASM module bytes with panic import
 */
export function createWasmWithPanicImport(): Uint8Array {
  // Type section: (i32, i32) -> void
  const typeSec = encodeSection(
    Section.Type,
    encodeVec([encodeFuncType([ValType.I32, ValType.I32], [])]),
  );

  // Import section: import env._panic as function type 0
  const importSec = encodeSection(
    Section.Import,
    encodeVec([[...encodeString("env"), ...encodeString("_panic"), ImportKind.Func, 0]]),
  );

  // Memory section: 1 page
  const memorySec = encodeSection(Section.Memory, encodeVec([encodeLimits(1)]));

  // Export section: export memory
  const exportSec = encodeSection(
    Section.Export,
    encodeVec([[...encodeString("memory"), ExportKind.Memory, 0]]),
  );

  return new Uint8Array([...WASM_HEADER, ...typeSec, ...importSec, ...memorySec, ...exportSec]);
}

/**
 * Creates a WASM module that exports a "doPanic" function which calls _panic.
 *
 * Structure:
 * - Type section: (i32, i32) -> void, () -> void
 * - Import section: env._panic function (type 0)
 * - Function section: doPanic function (type 1)
 * - Memory section: 1 page
 * - Export section: memory and doPanic
 * - Code section: doPanic calls _panic(100, 10)
 *
 * @returns Valid WASM module bytes that can trigger panic
 */
export function createWasmThatCallsPanic(): Uint8Array {
  // Type section: two types
  // Type 0: (i32, i32) -> void (for _panic)
  // Type 1: () -> void (for doPanic)
  const typeSec = encodeSection(
    Section.Type,
    encodeVec([
      encodeFuncType([ValType.I32, ValType.I32], []),
      encodeFuncType([], []),
    ]),
  );

  // Import section: import env._panic as function type 0
  const importSec = encodeSection(
    Section.Import,
    encodeVec([[...encodeString("env"), ...encodeString("_panic"), ImportKind.Func, 0]]),
  );

  // Function section: 1 function (doPanic) using type 1
  const funcSec = encodeSection(Section.Function, [...encodeUleb128(1), 1]);

  // Memory section: 1 page
  const memorySec = encodeSection(Section.Memory, encodeVec([encodeLimits(1)]));

  // Export section: export memory and doPanic
  const exportSec = encodeSection(
    Section.Export,
    encodeVec([
      [...encodeString("memory"), ExportKind.Memory, 0],
      [...encodeString("doPanic"), ExportKind.Func, 1], // func index 1 (0 is import)
    ]),
  );

  // Code section: doPanic body
  // Calls _panic(100, 10)
  const body = [
    0, // 0 local declarations
    Op.I32Const,
    ...encodeSleb128(100), // ptr = 100
    Op.I32Const,
    ...encodeSleb128(10), // len = 10
    Op.Call,
    ...encodeUleb128(0), // call function index 0 (_panic import)
    Op.End,
  ];
  const codeSec = encodeSection(Section.Code, encodeVec([[...encodeUleb128(body.length), ...body]]));

  return new Uint8Array([
    ...WASM_HEADER,
    ...typeSec,
    ...importSec,
    ...funcSec,
    ...memorySec,
    ...exportSec,
    ...codeSec,
  ]);
}

/**
 * Creates an empty but valid WASM module (just header, no sections).
 *
 * This is technically valid WASM - a module with no imports, exports,
 * functions, or memory.
 *
 * @returns Valid empty WASM module bytes
 */
export function createEmptyModule(): Uint8Array {
  return new Uint8Array(WASM_HEADER);
}

/**
 * Creates a WASM module with a simple add function.
 *
 * Structure:
 * - Type section: (i32, i32) -> i32
 * - Function section: 1 function
 * - Export section: exports function as "add"
 * - Code section: returns param0 + param1
 *
 * @returns Valid WASM module with add function
 */
export function createAddFunction(): Uint8Array {
  // Type section: (i32, i32) -> i32
  const typeSec = encodeSection(
    Section.Type,
    encodeVec([encodeFuncType([ValType.I32, ValType.I32], [ValType.I32])]),
  );

  // Function section: 1 function using type 0
  const funcSec = encodeSection(Section.Function, [...encodeUleb128(1), 0]);

  // Export section: export function 0 as "add"
  const exportSec = encodeSection(
    Section.Export,
    encodeVec([[...encodeString("add"), ExportKind.Func, 0]]),
  );

  // Code section: add function body
  // local.get 0, local.get 1, i32.add
  const body = [
    0, // 0 local declarations
    0x20,
    0x00, // local.get 0
    0x20,
    0x01, // local.get 1
    0x6a, // i32.add
    Op.End,
  ];
  const codeSec = encodeSection(Section.Code, encodeVec([[...encodeUleb128(body.length), ...body]]));

  return new Uint8Array([...WASM_HEADER, ...typeSec, ...funcSec, ...exportSec, ...codeSec]);
}
