/**
 * Memory utilities for WASM linear memory interaction.
 *
 * This module provides tools for safely managing WebAssembly linear memory:
 *
 * - {@link WasmMemory}: Core memory manager for allocation, deallocation,
 *   and data transfer between JavaScript and WASM
 * - {@link AllocationScope}: RAII-style scope for automatic cleanup of
 *   temporary allocations
 *
 * ## Memory Model
 *
 * WASM linear memory is a contiguous byte array that can grow but never
 * shrink. The Zig WASM modules export `alloc` and `free` functions that
 * manage memory within this array. {@link WasmMemory} wraps these exports
 * to provide a safe, ergonomic interface.
 *
 * **Important**: Memory views (`Uint8Array` from `getView`) become invalid
 * when memory grows. Always use `copyOut` for data you need to retain, or
 * re-acquire views after any operation that might allocate.
 *
 * @example Basic allocation and data transfer
 * ```ts
 * import { loadWasm, WasmMemory } from "@zig-wasm/core";
 *
 * const { exports } = await loadWasm({ wasmPath: "./module.wasm" });
 * const mem = new WasmMemory(exports);
 *
 * // Allocate and copy data into WASM memory
 * const data = new Uint8Array([1, 2, 3, 4]);
 * const slice = mem.allocateAndCopy(data);
 *
 * // Call WASM function with the pointer and length
 * const result = exports.processData(slice.ptr, slice.len);
 *
 * // Copy result out and free the input
 * const output = mem.copyOut(resultPtr, resultLen);
 * mem.deallocate(slice.ptr, slice.len);
 * ```
 *
 * @example Using AllocationScope for automatic cleanup
 * ```ts
 * import { AllocationScope, WasmMemory } from "@zig-wasm/core";
 *
 * const result = AllocationScope.use(mem, (scope) => {
 *   // All allocations in this scope are tracked
 *   const input = scope.allocAndCopy(inputData);
 *   const output = scope.alloc(outputSize);
 *
 *   exports.transform(input.ptr, input.len, output);
 *
 *   // Copy out the result before scope ends
 *   return mem.copyOut(output, outputSize);
 * }); // input and output are automatically freed here
 * ```
 *
 * @example String handling
 * ```ts
 * import { WasmMemory } from "@zig-wasm/core";
 *
 * const mem = new WasmMemory(exports);
 *
 * // Encode string to UTF-8 in WASM memory
 * const slice = mem.encodeString("Hello, World!");
 * exports.processString(slice.ptr, slice.len);
 *
 * // Decode UTF-8 from WASM memory
 * const resultStr = mem.decodeString(resultPtr, resultLen);
 *
 * // Or decode and free in one call
 * const resultStr2 = mem.decodeStringAndFree(resultPtr, resultLen);
 * ```
 *
 * @module memory
 */

import { WasmMemoryError } from "./errors.ts";
import type { WasmMemoryExports, WasmPtr, WasmSize, WasmSlice } from "./types.ts";

/** Text encoder/decoder for string operations */
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

/**
 * Memory manager for a WASM module instance.
 *
 * Provides methods for:
 * - Allocation and deallocation via the module's `alloc`/`free` exports
 * - Copying data between JavaScript and WASM linear memory
 * - String encoding/decoding (UTF-8)
 * - Reading/writing numeric values (u32, u64, f32, f64)
 *
 * @example
 * ```ts
 * import { loadWasm, WasmMemory } from "@zig-wasm/core";
 *
 * const { exports } = await loadWasm({ wasmPath: "./module.wasm" });
 * const mem = new WasmMemory(exports);
 *
 * // Allocate 1024 bytes
 * const ptr = mem.allocate(1024);
 *
 * // Copy data in
 * mem.copyIn(ptr, new Uint8Array([1, 2, 3, 4]));
 *
 * // Free when done
 * mem.deallocate(ptr, 1024);
 * ```
 */
export class WasmMemory {
  private readonly memory: WebAssembly.Memory;
  private readonly alloc: (size: number) => number;
  private readonly free: (ptr: number, size: number) => void;

  /**
   * Creates a new WasmMemory manager.
   *
   * @param exports - The WASM module exports containing `memory`, `alloc`, and `free`
   *
   * @example
   * ```ts
   * import { loadWasm, WasmMemory } from "@zig-wasm/core";
   *
   * const { exports } = await loadWasm({ wasmPath: "./module.wasm" });
   * const mem = new WasmMemory(exports);
   * ```
   */
  constructor(exports: WasmMemoryExports) {
    this.memory = exports.memory;
    this.alloc = exports.alloc;
    this.free = exports.free;
  }

  /**
   * Get the current memory buffer.
   *
   * **Warning**: This buffer reference becomes invalid after memory grows.
   * Re-acquire it after any operation that might allocate memory.
   */
  get buffer(): ArrayBuffer {
    return this.memory.buffer;
  }

  /**
   * Get a Uint8Array view of the entire WASM memory.
   *
   * **Warning**: This view becomes invalid after memory grows.
   */
  get view(): Uint8Array {
    return new Uint8Array(this.memory.buffer);
  }

  /**
   * Allocate memory in WASM linear memory.
   *
   * @param size - Number of bytes to allocate (must be positive)
   * @returns The pointer to the allocated memory
   * @throws {@link WasmMemoryError} if size is not positive or allocation fails
   *
   * @example
   * ```ts
   * const ptr = mem.allocate(1024);
   * // Use the memory...
   * mem.deallocate(ptr, 1024);
   * ```
   */
  allocate(size: WasmSize): WasmPtr {
    if (size <= 0) {
      throw new WasmMemoryError("Allocation size must be positive");
    }
    const ptr = this.alloc(size);
    if (ptr === 0) {
      throw new WasmMemoryError(`Failed to allocate ${size} bytes in WASM memory`);
    }
    return ptr;
  }

  /**
   * Free previously allocated memory.
   *
   * @param ptr - Pointer to the memory to free
   * @param size - Size of the allocation in bytes
   *
   * @example
   * ```ts
   * const ptr = mem.allocate(1024);
   * // Use the memory...
   * mem.deallocate(ptr, 1024);
   * ```
   */
  deallocate(ptr: WasmPtr, size: WasmSize): void {
    if (ptr !== 0 && size > 0) {
      this.free(ptr, size);
    }
  }

  /**
   * Copy bytes into WASM memory at the given pointer.
   *
   * @param ptr - Destination pointer in WASM memory
   * @param data - Data to copy
   *
   * @example
   * ```ts
   * const ptr = mem.allocate(4);
   * mem.copyIn(ptr, new Uint8Array([1, 2, 3, 4]));
   * ```
   */
  copyIn(ptr: WasmPtr, data: Uint8Array): void {
    const view = new Uint8Array(this.memory.buffer, ptr, data.length);
    view.set(data);
  }

  /**
   * Copy bytes out of WASM memory.
   *
   * Returns a new `Uint8Array` that is a copy of the WASM memory,
   * safe to use even after memory grows.
   *
   * @param ptr - Source pointer in WASM memory
   * @param len - Number of bytes to copy
   * @returns A new Uint8Array containing the copied data
   *
   * @example
   * ```ts
   * const data = mem.copyOut(resultPtr, resultLen);
   * console.log(data); // Safe to use
   * ```
   */
  copyOut(ptr: WasmPtr, len: WasmSize): Uint8Array {
    return new Uint8Array(this.memory.buffer.slice(ptr, ptr + len));
  }

  /**
   * Get a view (not copy) of WASM memory.
   *
   * **Warning**: This view becomes invalid if memory grows. Only use for
   * temporary access when you're certain no allocations will occur.
   *
   * @param ptr - Pointer in WASM memory
   * @param len - Length of the view
   * @returns A Uint8Array view into WASM memory
   *
   * @example
   * ```ts
   * // Only valid until memory grows
   * const view = mem.getView(ptr, len);
   * const firstByte = view[0];
   * ```
   */
  getView(ptr: WasmPtr, len: WasmSize): Uint8Array {
    return new Uint8Array(this.memory.buffer, ptr, len);
  }

  /**
   * Allocate memory and copy data into it.
   *
   * Convenience method that combines {@link allocate} and {@link copyIn}.
   * Empty arrays are handled specially (returns `{ ptr: 0, len: 0 }`).
   *
   * @param data - Data to copy into WASM memory
   * @returns A {@link WasmSlice} with the pointer and length
   *
   * @example
   * ```ts
   * const slice = mem.allocateAndCopy(new Uint8Array([1, 2, 3, 4]));
   * exports.processData(slice.ptr, slice.len);
   * mem.deallocate(slice.ptr, slice.len);
   * ```
   */
  allocateAndCopy(data: Uint8Array): WasmSlice {
    // Handle empty data - no allocation needed, Zig handles ptr[0..0] correctly
    if (data.length === 0) {
      return { ptr: 0, len: 0 };
    }
    const ptr = this.allocate(data.length);
    this.copyIn(ptr, data);
    return { ptr, len: data.length };
  }

  /**
   * Copy data out and free the allocation in one operation.
   *
   * Useful for retrieving returned data from WASM functions.
   *
   * @param ptr - Pointer to the data
   * @param len - Length of the data
   * @returns A new Uint8Array containing the copied data
   *
   * @example
   * ```ts
   * // WASM function returns ptr and len
   * const [resultPtr, resultLen] = exports.compute(input);
   * const result = mem.copyOutAndFree(resultPtr, resultLen);
   * ```
   */
  copyOutAndFree(ptr: WasmPtr, len: WasmSize): Uint8Array {
    const result = this.copyOut(ptr, len);
    this.deallocate(ptr, len);
    return result;
  }

  /**
   * Encode a string to UTF-8 and copy into WASM memory.
   *
   * @param str - The string to encode
   * @returns A {@link WasmSlice} with the pointer and length
   *
   * @example
   * ```ts
   * const slice = mem.encodeString("Hello, World!");
   * exports.processString(slice.ptr, slice.len);
   * mem.deallocate(slice.ptr, slice.len);
   * ```
   */
  encodeString(str: string): WasmSlice {
    // Empty string handled by allocateAndCopy
    const bytes = textEncoder.encode(str);
    return this.allocateAndCopy(bytes);
  }

  /**
   * Decode a UTF-8 string from WASM memory.
   *
   * @param ptr - Pointer to the string data
   * @param len - Length of the string in bytes
   * @returns The decoded string
   *
   * @example
   * ```ts
   * const str = mem.decodeString(ptr, len);
   * console.log(str);
   * ```
   */
  decodeString(ptr: WasmPtr, len: WasmSize): string {
    const bytes = this.getView(ptr, len);
    return textDecoder.decode(bytes);
  }

  /**
   * Decode a UTF-8 string and free the allocation.
   *
   * @param ptr - Pointer to the string data
   * @param len - Length of the string in bytes
   * @returns The decoded string
   *
   * @example
   * ```ts
   * // WASM function returns a string
   * const str = mem.decodeStringAndFree(resultPtr, resultLen);
   * ```
   */
  decodeStringAndFree(ptr: WasmPtr, len: WasmSize): string {
    const result = this.decodeString(ptr, len);
    this.deallocate(ptr, len);
    return result;
  }

  /**
   * Read a 32-bit unsigned integer from memory.
   *
   * @param ptr - Pointer to read from (must be 4-byte aligned for best performance)
   * @returns The u32 value
   */
  readU32(ptr: WasmPtr): number {
    const view = new DataView(this.memory.buffer);
    return view.getUint32(ptr, true); // little-endian
  }

  /**
   * Read a 64-bit unsigned integer from memory.
   *
   * @param ptr - Pointer to read from (must be 8-byte aligned for best performance)
   * @returns The u64 value as a BigInt
   */
  readU64(ptr: WasmPtr): bigint {
    const view = new DataView(this.memory.buffer);
    return view.getBigUint64(ptr, true); // little-endian
  }

  /**
   * Write a 32-bit unsigned integer to memory.
   *
   * @param ptr - Pointer to write to
   * @param value - The u32 value to write
   */
  writeU32(ptr: WasmPtr, value: number): void {
    const view = new DataView(this.memory.buffer);
    view.setUint32(ptr, value, true);
  }

  /**
   * Write a 64-bit unsigned integer to memory.
   *
   * @param ptr - Pointer to write to
   * @param value - The u64 value to write (as BigInt)
   */
  writeU64(ptr: WasmPtr, value: bigint): void {
    const view = new DataView(this.memory.buffer);
    view.setBigUint64(ptr, value, true);
  }

  /**
   * Read a 32-bit float from memory.
   *
   * @param ptr - Pointer to read from
   * @returns The f32 value
   */
  readF32(ptr: WasmPtr): number {
    const view = new DataView(this.memory.buffer);
    return view.getFloat32(ptr, true);
  }

  /**
   * Read a 64-bit float from memory.
   *
   * @param ptr - Pointer to read from
   * @returns The f64 value
   */
  readF64(ptr: WasmPtr): number {
    const view = new DataView(this.memory.buffer);
    return view.getFloat64(ptr, true);
  }
}

/**
 * RAII-style scope for temporary WASM allocations.
 *
 * Tracks all allocations made within the scope and automatically frees
 * them when the scope ends. This prevents memory leaks when performing
 * multiple allocations for a single operation.
 *
 * Use the static {@link AllocationScope.use} method for the safest pattern,
 * which ensures cleanup even if an exception is thrown.
 *
 * @example Using the static use() method (recommended)
 * ```ts
 * import { AllocationScope, WasmMemory } from "@zig-wasm/core";
 *
 * const result = AllocationScope.use(mem, (scope) => {
 *   const input = scope.allocAndCopy(inputData);
 *   const output = scope.alloc(outputSize);
 *
 *   exports.transform(input.ptr, input.len, output);
 *
 *   // Copy out result before scope ends
 *   return mem.copyOut(output, outputSize);
 * }); // All allocations freed automatically
 * ```
 *
 * @example Manual scope management
 * ```ts
 * const scope = new AllocationScope(mem);
 * try {
 *   const slice = scope.encodeString("Hello");
 *   exports.processString(slice.ptr, slice.len);
 * } finally {
 *   scope.dispose(); // Free all allocations
 * }
 * ```
 */
export class AllocationScope {
  private readonly mem: WasmMemory;
  private allocations: WasmSlice[] = [];

  /**
   * Creates a new AllocationScope.
   *
   * @param mem - The {@link WasmMemory} instance to use for allocations
   */
  constructor(mem: WasmMemory) {
    this.mem = mem;
  }

  /**
   * Allocate memory that will be freed when scope ends.
   *
   * @param size - Number of bytes to allocate
   * @returns The pointer to the allocated memory
   *
   * @example
   * ```ts
   * AllocationScope.use(mem, (scope) => {
   *   const ptr = scope.alloc(1024);
   *   // Use the memory...
   * }); // Automatically freed
   * ```
   */
  alloc(size: WasmSize): WasmPtr {
    const ptr = this.mem.allocate(size);
    this.allocations.push({ ptr, len: size });
    return ptr;
  }

  /**
   * Allocate and copy data into scoped memory.
   *
   * @param data - Data to copy
   * @returns A {@link WasmSlice} with pointer and length
   *
   * @example
   * ```ts
   * AllocationScope.use(mem, (scope) => {
   *   const slice = scope.allocAndCopy(new Uint8Array([1, 2, 3]));
   *   exports.process(slice.ptr, slice.len);
   * });
   * ```
   */
  allocAndCopy(data: Uint8Array): WasmSlice {
    const slice = this.mem.allocateAndCopy(data);
    this.allocations.push(slice);
    return slice;
  }

  /**
   * Encode a string into scoped memory.
   *
   * @param str - String to encode as UTF-8
   * @returns A {@link WasmSlice} with pointer and length
   *
   * @example
   * ```ts
   * AllocationScope.use(mem, (scope) => {
   *   const slice = scope.encodeString("Hello, World!");
   *   exports.processString(slice.ptr, slice.len);
   * });
   * ```
   */
  encodeString(str: string): WasmSlice {
    const slice = this.mem.encodeString(str);
    this.allocations.push(slice);
    return slice;
  }

  /**
   * Free all allocations in this scope.
   *
   * Called automatically by {@link AllocationScope.use}, but can be
   * called manually if using the scope directly.
   */
  dispose(): void {
    for (const { ptr, len } of this.allocations) {
      this.mem.deallocate(ptr, len);
    }
    this.allocations = [];
  }

  /**
   * Execute a function with a scoped allocation context.
   *
   * Creates a new scope, passes it to the callback, and ensures all
   * allocations are freed when the callback returns (even if it throws).
   *
   * @typeParam T - The return type of the callback
   * @param mem - The {@link WasmMemory} instance to use
   * @param fn - Callback function that receives the scope
   * @returns The return value of the callback
   *
   * @example
   * ```ts
   * const result = AllocationScope.use(mem, (scope) => {
   *   const input = scope.allocAndCopy(data);
   *   const output = scope.alloc(outputLen);
   *   exports.transform(input.ptr, input.len, output);
   *   return mem.copyOut(output, outputLen);
   * });
   * // All temporary allocations are freed, result is safe to use
   * ```
   */
  static use<T>(mem: WasmMemory, fn: (scope: AllocationScope) => T): T {
    const scope = new AllocationScope(mem);
    try {
      return fn(scope);
    } finally {
      scope.dispose();
    }
  }
}
