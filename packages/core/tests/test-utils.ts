/**
 * Test utilities for core package tests
 */

/**
 * Creates a minimal valid WASM module that exports memory
 *
 * WASM binary structure:
 * - Magic: \0asm (4 bytes)
 * - Version: 1 (4 bytes)
 * - Memory section: defines 1 page of memory
 * - Export section: exports memory as "memory"
 */
export function createMinimalWasmWithMemory(): Uint8Array {
  // dprint-ignore
  return new Uint8Array([
    // Magic number: \0asm
    0x00, 0x61, 0x73, 0x6d,
    // Version: 1
    0x01, 0x00, 0x00, 0x00,
    // Memory section (id: 5)
    0x05, // section id
    0x03, // section size (3 bytes)
    0x01, // 1 memory
    0x00, // flags: no maximum
    0x01, // initial: 1 page (64KB)
    // Export section (id: 7)
    0x07, // section id
    0x0a, // section size (10 bytes)
    0x01, // 1 export
    0x06, // name length: 6
    0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79, // "memory"
    0x02, // export kind: memory
    0x00, // memory index: 0
  ]);
}

/**
 * Creates a minimal valid WASM module WITHOUT memory export
 * Used to test error handling
 */
export function createWasmWithoutMemory(): Uint8Array {
  // dprint-ignore
  return new Uint8Array([
    // Magic number: \0asm
    0x00, 0x61, 0x73, 0x6d,
    // Version: 1
    0x01, 0x00, 0x00, 0x00,
    // Type section (id: 1) - define function type () -> i32
    0x01, // section id
    0x05, // section size
    0x01, // 1 type
    0x60, // func type
    0x00, // 0 params
    0x01, // 1 result
    0x7f, // i32
    // Function section (id: 3) - declare 1 function
    0x03, // section id
    0x02, // section size
    0x01, // 1 function
    0x00, // type index 0
    // Export section (id: 7) - export function as "test"
    0x07, // section id
    0x08, // section size
    0x01, // 1 export
    0x04, // name length: 4
    0x74, 0x65, 0x73, 0x74, // "test"
    0x00, // export kind: function
    0x00, // function index: 0
    // Code section (id: 10) - function body
    0x0a, // section id
    0x06, // section size
    0x01, // 1 function body
    0x04, // body size
    0x00, // 0 locals
    0x41, 0x2a, // i32.const 42
    0x0b, // end
  ]);
}

/**
 * Creates invalid WASM bytes (not a valid module)
 */
export function createInvalidWasm(): Uint8Array {
  return new Uint8Array([0x00, 0x01, 0x02, 0x03]);
}

/**
 * Creates a WASM module with memory that imports _panic from env
 * for testing the panic handler integration
 *
 * This module:
 * - Imports _panic(ptr: i32, len: i32) from env
 * - Exports memory
 */
export function createWasmWithPanicImport(): Uint8Array {
  // dprint-ignore
  return new Uint8Array([
    // Magic number: \0asm
    0x00, 0x61, 0x73, 0x6d,
    // Version: 1
    0x01, 0x00, 0x00, 0x00,

    // Type section (id: 1) - defines function signatures
    0x01, // section id
    0x06, // section size (6 bytes)
    0x01, // 1 type
    // type 0: (i32, i32) -> () - panic signature
    0x60, // func type
    0x02, // 2 params
    0x7f, 0x7f, // i32, i32
    0x00, // 0 results

    // Import section (id: 2) - import _panic from env
    0x02, // section id
    0x0e, // section size (14 bytes)
    0x01, // 1 import
    0x03, // module name length: 3
    0x65, 0x6e, 0x76, // "env"
    0x06, // field name length: 6
    0x5f, 0x70, 0x61, 0x6e, 0x69, 0x63, // "_panic"
    0x00, // import kind: function
    0x00, // type index: 0

    // Memory section (id: 5)
    0x05, // section id
    0x03, // section size
    0x01, // 1 memory
    0x00, // flags: no maximum
    0x01, // initial: 1 page

    // Export section (id: 7)
    0x07, // section id
    0x0a, // section size (10 bytes)
    0x01, // 1 export
    0x06, // name length: 6
    0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79, // "memory"
    0x02, // export kind: memory
    0x00, // memory index: 0
  ]);
}
