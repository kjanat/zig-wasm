/**
 * Memory utilities for WASM linear memory interaction
 */

import type { WasmMemoryExports, WasmPtr, WasmSize, WasmSlice } from "./types.ts";

/** Text encoder/decoder for string operations */
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8");

/**
 * Memory manager for a WASM module instance
 * Handles allocation, copying data in/out, and string conversion
 */
export class WasmMemory {
  private readonly memory: WebAssembly.Memory;
  private readonly alloc: (size: number) => number;
  private readonly free: (ptr: number, size: number) => void;

  constructor(exports: WasmMemoryExports) {
    this.memory = exports.memory;
    this.alloc = exports.alloc;
    this.free = exports.free;
  }

  /** Get current memory buffer (may change after growth) */
  get buffer(): ArrayBuffer {
    return this.memory.buffer;
  }

  /** Get a Uint8Array view of the entire memory */
  get view(): Uint8Array {
    return new Uint8Array(this.memory.buffer);
  }

  /** Allocate memory in WASM and return pointer */
  allocate(size: WasmSize): WasmPtr {
    if (size <= 0) {
      throw new Error("Allocation size must be positive");
    }
    const ptr = this.alloc(size);
    if (ptr === 0) {
      throw new Error(`Failed to allocate ${size} bytes in WASM memory`);
    }
    return ptr;
  }

  /** Free previously allocated memory */
  deallocate(ptr: WasmPtr, size: WasmSize): void {
    if (ptr !== 0 && size > 0) {
      this.free(ptr, size);
    }
  }

  /** Copy bytes into WASM memory at given pointer */
  copyIn(ptr: WasmPtr, data: Uint8Array): void {
    const view = new Uint8Array(this.memory.buffer, ptr, data.length);
    view.set(data);
  }

  /** Copy bytes out of WASM memory */
  copyOut(ptr: WasmPtr, len: WasmSize): Uint8Array {
    return new Uint8Array(this.memory.buffer.slice(ptr, ptr + len));
  }

  /** Get a view (not copy) of WASM memory - only valid until memory grows */
  getView(ptr: WasmPtr, len: WasmSize): Uint8Array {
    return new Uint8Array(this.memory.buffer, ptr, len);
  }

  /** Allocate and copy bytes into WASM memory, returns slice */
  allocateAndCopy(data: Uint8Array): WasmSlice {
    const ptr = this.allocate(data.length);
    this.copyIn(ptr, data);
    return { ptr, len: data.length };
  }

  /** Copy out and deallocate - useful for returned data */
  copyOutAndFree(ptr: WasmPtr, len: WasmSize): Uint8Array {
    const result = this.copyOut(ptr, len);
    this.deallocate(ptr, len);
    return result;
  }

  /** Encode string to UTF-8 and copy into WASM memory */
  encodeString(str: string): WasmSlice {
    const bytes = textEncoder.encode(str);
    return this.allocateAndCopy(bytes);
  }

  /** Decode UTF-8 string from WASM memory */
  decodeString(ptr: WasmPtr, len: WasmSize): string {
    const bytes = this.getView(ptr, len);
    return textDecoder.decode(bytes);
  }

  /** Decode and free - useful for returned strings */
  decodeStringAndFree(ptr: WasmPtr, len: WasmSize): string {
    const result = this.decodeString(ptr, len);
    this.deallocate(ptr, len);
    return result;
  }

  /** Read a u32 from memory */
  readU32(ptr: WasmPtr): number {
    const view = new DataView(this.memory.buffer);
    return view.getUint32(ptr, true); // little-endian
  }

  /** Read a u64 from memory (as BigInt) */
  readU64(ptr: WasmPtr): bigint {
    const view = new DataView(this.memory.buffer);
    return view.getBigUint64(ptr, true); // little-endian
  }

  /** Write a u32 to memory */
  writeU32(ptr: WasmPtr, value: number): void {
    const view = new DataView(this.memory.buffer);
    view.setUint32(ptr, value, true);
  }

  /** Write a u64 to memory */
  writeU64(ptr: WasmPtr, value: bigint): void {
    const view = new DataView(this.memory.buffer);
    view.setBigUint64(ptr, value, true);
  }

  /** Read f32 from memory */
  readF32(ptr: WasmPtr): number {
    const view = new DataView(this.memory.buffer);
    return view.getFloat32(ptr, true);
  }

  /** Read f64 from memory */
  readF64(ptr: WasmPtr): number {
    const view = new DataView(this.memory.buffer);
    return view.getFloat64(ptr, true);
  }
}

/**
 * RAII-style scope for temporary allocations
 * Automatically frees all allocations when disposed
 */
export class AllocationScope {
  private readonly mem: WasmMemory;
  private allocations: WasmSlice[] = [];

  constructor(mem: WasmMemory) {
    this.mem = mem;
  }

  /** Allocate memory that will be freed when scope ends */
  alloc(size: WasmSize): WasmPtr {
    const ptr = this.mem.allocate(size);
    this.allocations.push({ ptr, len: size });
    return ptr;
  }

  /** Allocate and copy data */
  allocAndCopy(data: Uint8Array): WasmSlice {
    const slice = this.mem.allocateAndCopy(data);
    this.allocations.push(slice);
    return slice;
  }

  /** Encode string into scoped allocation */
  encodeString(str: string): WasmSlice {
    const slice = this.mem.encodeString(str);
    this.allocations.push(slice);
    return slice;
  }

  /** Free all allocations in this scope */
  dispose(): void {
    for (const { ptr, len } of this.allocations) {
      this.mem.deallocate(ptr, len);
    }
    this.allocations = [];
  }

  /** Use with a callback, auto-dispose after */
  static use<T>(mem: WasmMemory, fn: (scope: AllocationScope) => T): T {
    const scope = new AllocationScope(mem);
    try {
      return fn(scope);
    } finally {
      scope.dispose();
    }
  }
}
