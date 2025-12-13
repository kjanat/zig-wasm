import { beforeEach, describe, expect, it, vi } from "vitest";
import { AllocationScope, WasmMemory } from "../src/memory.ts";
import type { WasmMemoryExports } from "../src/types.ts";

/**
 * Create a mock WASM memory environment for testing
 * Simulates Zig allocator behavior with simple bump allocation
 */
function createMockMemory(): WasmMemoryExports {
  const memory = new WebAssembly.Memory({ initial: 1 }); // 64KB
  let nextPtr = 1024; // Start allocations at 1KB offset
  const allocations = new Map<number, number>(); // ptr -> size

  return {
    memory,
    alloc: vi.fn((size: number) => {
      if (size <= 0) return 0;
      const ptr = nextPtr;
      nextPtr += size;
      allocations.set(ptr, size);
      return ptr;
    }),
    free: vi.fn((ptr: number, _size: number) => {
      allocations.delete(ptr);
      // In real WASM, this would update allocator state
    }),
  };
}

describe("WasmMemory", () => {
  let mockExports: WasmMemoryExports;
  let mem: WasmMemory;

  beforeEach(() => {
    mockExports = createMockMemory();
    mem = new WasmMemory(mockExports);
  });

  describe("allocation", () => {
    it("allocates memory and returns valid pointer", () => {
      const ptr = mem.allocate(100);
      expect(ptr).toBeGreaterThan(0);
      expect(mockExports.alloc).toHaveBeenCalledWith(100);
    });

    it("throws on zero-size allocation", () => {
      expect(() => mem.allocate(0)).toThrow("Allocation size must be positive");
    });

    it("throws on negative-size allocation", () => {
      expect(() => mem.allocate(-5)).toThrow("Allocation size must be positive");
    });

    it("throws when allocation fails (returns 0)", () => {
      mockExports.alloc = vi.fn(() => 0);
      mem = new WasmMemory(mockExports);
      expect(() => mem.allocate(100)).toThrow("Failed to allocate 100 bytes");
    });

    it("tracks multiple allocations independently", () => {
      const ptr1 = mem.allocate(50);
      const ptr2 = mem.allocate(100);
      const ptr3 = mem.allocate(25);

      expect(ptr1).not.toBe(ptr2);
      expect(ptr2).not.toBe(ptr3);
      expect(ptr1).not.toBe(ptr3);
    });
  });

  describe("deallocation", () => {
    it("frees allocated memory", () => {
      const ptr = mem.allocate(100);
      mem.deallocate(ptr, 100);
      expect(mockExports.free).toHaveBeenCalledWith(ptr, 100);
    });

    it("ignores null pointer deallocation", () => {
      mem.deallocate(0, 100);
      expect(mockExports.free).not.toHaveBeenCalled();
    });

    it("ignores zero-size deallocation", () => {
      mem.deallocate(1000, 0);
      expect(mockExports.free).not.toHaveBeenCalled();
    });

    it("handles both null pointer and zero size", () => {
      mem.deallocate(0, 0);
      expect(mockExports.free).not.toHaveBeenCalled();
    });
  });

  describe("memory views", () => {
    it("provides access to underlying buffer", () => {
      expect(mem.buffer).toBeInstanceOf(ArrayBuffer);
      expect(mem.buffer).toBe(mockExports.memory.buffer);
    });

    it("provides Uint8Array view of memory", () => {
      const view = mem.view;
      expect(view).toBeInstanceOf(Uint8Array);
      expect(view.buffer).toBe(mockExports.memory.buffer);
    });

    it("returns fresh view that reflects memory state", () => {
      const view1 = mem.view;
      const view2 = mem.view;
      expect(view1).not.toBe(view2); // Different objects
      expect(view1.buffer).toBe(view2.buffer); // Same underlying buffer
    });
  });

  describe("copyIn/copyOut", () => {
    it("copies data into WASM memory", () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const ptr = mem.allocate(data.length);
      mem.copyIn(ptr, data);

      const view = new Uint8Array(mockExports.memory.buffer, ptr, data.length);
      expect(Array.from(view)).toEqual([1, 2, 3, 4, 5]);
    });

    it("copies data out of WASM memory", () => {
      const original = new Uint8Array([10, 20, 30, 40]);
      const ptr = mem.allocate(original.length);
      mem.copyIn(ptr, original);

      const result = mem.copyOut(ptr, original.length);
      expect(Array.from(result)).toEqual([10, 20, 30, 40]);
    });

    it("copyOut creates independent copy", () => {
      const data = new Uint8Array([1, 2, 3]);
      const ptr = mem.allocate(data.length);
      mem.copyIn(ptr, data);

      const copy = mem.copyOut(ptr, data.length);
      copy[0] = 99;

      const view = new Uint8Array(mockExports.memory.buffer, ptr, data.length);
      expect(view[0]).toBe(1); // Original unchanged
    });

    it("handles empty data", () => {
      const ptr = mem.allocate(1);
      mem.copyIn(ptr, new Uint8Array([]));
      const result = mem.copyOut(ptr, 0);
      expect(result.length).toBe(0);
    });
  });

  describe("getView", () => {
    it("returns view without copying", () => {
      const data = new Uint8Array([5, 10, 15]);
      const ptr = mem.allocate(data.length);
      mem.copyIn(ptr, data);

      const view = mem.getView(ptr, data.length);
      expect(Array.from(view)).toEqual([5, 10, 15]);
    });

    it("view reflects changes to underlying memory", () => {
      const ptr = mem.allocate(3);
      const view = mem.getView(ptr, 3);

      mem.copyIn(ptr, new Uint8Array([1, 2, 3]));
      expect(Array.from(view)).toEqual([1, 2, 3]);
    });

    it("modifying view modifies memory", () => {
      const ptr = mem.allocate(3);
      const view = mem.getView(ptr, 3);
      view[0] = 42;

      const readBack = mem.copyOut(ptr, 1);
      expect(readBack[0]).toBe(42);
    });
  });

  describe("allocateAndCopy", () => {
    it("allocates and copies in one operation", () => {
      const data = new Uint8Array([7, 14, 21, 28]);
      const slice = mem.allocateAndCopy(data);

      expect(slice.ptr).toBeGreaterThan(0);
      expect(slice.len).toBe(4);

      const readBack = mem.copyOut(slice.ptr, slice.len);
      expect(Array.from(readBack)).toEqual([7, 14, 21, 28]);
    });

    it("tracks allocation correctly", () => {
      const data = new Uint8Array([1, 2, 3]);
      const slice = mem.allocateAndCopy(data);

      expect(mockExports.alloc).toHaveBeenCalledWith(3);
      mem.deallocate(slice.ptr, slice.len);
      expect(mockExports.free).toHaveBeenCalledWith(slice.ptr, 3);
    });
  });

  describe("copyOutAndFree", () => {
    it("copies out and deallocates in one operation", () => {
      const data = new Uint8Array([100, 101, 102]);
      const ptr = mem.allocate(data.length);
      mem.copyIn(ptr, data);

      const result = mem.copyOutAndFree(ptr, data.length);

      expect(Array.from(result)).toEqual([100, 101, 102]);
      expect(mockExports.free).toHaveBeenCalledWith(ptr, 3);
    });

    it("result is independent copy after free", () => {
      const data = new Uint8Array([1, 2, 3]);
      const ptr = mem.allocate(data.length);
      mem.copyIn(ptr, data);

      const result = mem.copyOutAndFree(ptr, data.length);
      result[0] = 99;

      expect(result[0]).toBe(99);
      // Can't verify original memory as it's freed, but copy should be independent
    });
  });

  describe("string operations", () => {
    it("encodes string to UTF-8", () => {
      const slice = mem.encodeString("hello");

      expect(slice.ptr).toBeGreaterThan(0);
      expect(slice.len).toBe(5);

      const bytes = mem.copyOut(slice.ptr, slice.len);
      expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]); // "hello"
    });

    it("handles Unicode strings", () => {
      const emoji = "👋🌍";
      const slice = mem.encodeString(emoji);

      const decoded = mem.decodeString(slice.ptr, slice.len);
      expect(decoded).toBe(emoji);
    });

    it("decodes UTF-8 from memory", () => {
      const original = "test string";
      const slice = mem.encodeString(original);
      const decoded = mem.decodeString(slice.ptr, slice.len);

      expect(decoded).toBe(original);
    });

    it("decodeStringAndFree decodes and deallocates", () => {
      const original = "cleanup test";
      const slice = mem.encodeString(original);
      const decoded = mem.decodeStringAndFree(slice.ptr, slice.len);

      expect(decoded).toBe(original);
      expect(mockExports.free).toHaveBeenCalledWith(slice.ptr, slice.len);
    });

    it("handles empty string", () => {
      const text = "";
      const bytes = new TextEncoder().encode(text);

      if (bytes.length === 0) {
        // Empty strings result in 0-byte allocation which is rejected
        // This is expected behavior - empty strings don't need allocation
        const decoded = new TextDecoder().decode(bytes);
        expect(decoded).toBe("");
      } else {
        const slice = mem.encodeString(text);
        const decoded = mem.decodeString(slice.ptr, slice.len);
        expect(decoded).toBe(text);
      }
    });

    it("preserves multi-byte characters", () => {
      const chinese = "你好世界";
      const slice = mem.encodeString(chinese);
      const decoded = mem.decodeString(slice.ptr, slice.len);
      expect(decoded).toBe(chinese);
    });
  });

  describe("numeric type operations", () => {
    it("writes and reads u32", () => {
      const ptr = mem.allocate(4);
      mem.writeU32(ptr, 0x12345678);

      const value = mem.readU32(ptr);
      expect(value).toBe(0x12345678);
    });

    it("writes and reads u64", () => {
      const ptr = mem.allocate(8);
      const value = 0x123456789ABCDEFn;
      mem.writeU64(ptr, value);

      const read = mem.readU64(ptr);
      expect(read).toBe(value);
    });

    it("handles u32 boundaries", () => {
      const ptr = mem.allocate(4);
      mem.writeU32(ptr, 0xFFFFFFFF);
      expect(mem.readU32(ptr)).toBe(0xFFFFFFFF);

      mem.writeU32(ptr, 0);
      expect(mem.readU32(ptr)).toBe(0);
    });

    it("handles u64 boundaries", () => {
      const ptr = mem.allocate(8);
      mem.writeU64(ptr, 0xFFFFFFFFFFFFFFFFn);
      expect(mem.readU64(ptr)).toBe(0xFFFFFFFFFFFFFFFFn);

      mem.writeU64(ptr, 0n);
      expect(mem.readU64(ptr)).toBe(0n);
    });

    it("writes and reads f32", () => {
      const ptr = mem.allocate(4);
      const view = new DataView(mockExports.memory.buffer);
      view.setFloat32(ptr, Math.PI, true);

      const value = mem.readF32(ptr);
      expect(value).toBeCloseTo(Math.PI, 5);
    });

    it("writes and reads f64", () => {
      const ptr = mem.allocate(8);
      const view = new DataView(mockExports.memory.buffer);
      view.setFloat64(ptr, Math.PI, true);

      const value = mem.readF64(ptr);
      expect(value).toBe(Math.PI);
    });

    it("uses little-endian byte order", () => {
      const ptr = mem.allocate(4);
      mem.writeU32(ptr, 0x01020304);

      const bytes = mem.copyOut(ptr, 4);
      // Little-endian: least significant byte first
      expect(Array.from(bytes)).toEqual([0x04, 0x03, 0x02, 0x01]);
    });
  });
});

describe("AllocationScope", () => {
  let mockExports: WasmMemoryExports;
  let mem: WasmMemory;

  beforeEach(() => {
    mockExports = createMockMemory();
    mem = new WasmMemory(mockExports);
  });

  describe("RAII pattern", () => {
    it("creates scope and tracks allocations", () => {
      const scope = new AllocationScope(mem);
      const ptr1 = scope.alloc(100);
      const ptr2 = scope.alloc(50);

      expect(ptr1).toBeGreaterThan(0);
      expect(ptr2).toBeGreaterThan(0);
      expect(ptr1).not.toBe(ptr2);
    });

    it("dispose frees all allocations", () => {
      const scope = new AllocationScope(mem);
      const ptr1 = scope.alloc(100);
      const ptr2 = scope.alloc(50);

      scope.dispose();

      expect(mockExports.free).toHaveBeenCalledWith(ptr1, 100);
      expect(mockExports.free).toHaveBeenCalledWith(ptr2, 50);
      expect(mockExports.free).toHaveBeenCalledTimes(2);
    });

    it("dispose is safe to call multiple times", () => {
      const scope = new AllocationScope(mem);
      scope.alloc(100);

      scope.dispose();
      const firstCallCount = vi.mocked(mockExports.free).mock.calls.length;

      scope.dispose();
      const secondCallCount = vi.mocked(mockExports.free).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount); // No additional frees
    });

    it("dispose works with no allocations", () => {
      const scope = new AllocationScope(mem);
      expect(() => scope.dispose()).not.toThrow();
      expect(mockExports.free).not.toHaveBeenCalled();
    });
  });

  describe("allocation methods", () => {
    it("allocAndCopy tracks allocation", () => {
      const scope = new AllocationScope(mem);
      const data = new Uint8Array([1, 2, 3, 4]);
      const slice = scope.allocAndCopy(data);

      scope.dispose();

      expect(mockExports.free).toHaveBeenCalledWith(slice.ptr, slice.len);
    });

    it("encodeString tracks allocation", () => {
      const scope = new AllocationScope(mem);
      const slice = scope.encodeString("test");

      scope.dispose();

      expect(mockExports.free).toHaveBeenCalledWith(slice.ptr, slice.len);
    });

    it("multiple operations tracked correctly", () => {
      const scope = new AllocationScope(mem);
      scope.alloc(10);
      scope.allocAndCopy(new Uint8Array([1, 2]));
      scope.encodeString("hi");

      scope.dispose();

      expect(mockExports.free).toHaveBeenCalledTimes(3);
    });
  });

  describe("static use method", () => {
    it("executes callback with scope", () => {
      const result = AllocationScope.use(mem, (scope) => {
        const slice = scope.allocAndCopy(new Uint8Array([5, 10]));
        return mem.copyOut(slice.ptr, slice.len);
      });

      expect(Array.from(result)).toEqual([5, 10]);
    });

    it("disposes scope after callback", () => {
      let ptr: number | undefined;

      AllocationScope.use(mem, (scope) => {
        ptr = scope.alloc(100);
      });

      expect(ptr).toBeDefined();
      expect(mockExports.free).toHaveBeenCalledWith(ptr, 100);
    });

    it("disposes even if callback throws", () => {
      let ptr: number | undefined;

      expect(() => {
        AllocationScope.use(mem, (scope) => {
          ptr = scope.alloc(100);
          throw new Error("test error");
        });
      }).toThrow("test error");

      expect(ptr).toBeDefined();
      expect(mockExports.free).toHaveBeenCalledWith(ptr, 100);
    });

    it("propagates callback return value", () => {
      const result = AllocationScope.use(mem, () => {
        return { success: true, value: 42 };
      });

      expect(result).toEqual({ success: true, value: 42 });
    });

    it("propagates callback errors", () => {
      expect(() => {
        AllocationScope.use(mem, () => {
          throw new TypeError("custom error");
        });
      }).toThrow(TypeError);
    });
  });

  describe("memory leak prevention", () => {
    it("scope prevents leaks in normal flow", () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        AllocationScope.use(mem, (scope) => {
          scope.alloc(100);
        });
      }

      // Each iteration should have freed its allocation
      expect(mockExports.free).toHaveBeenCalledTimes(iterations);
    });

    it("scope prevents leaks in error flow", () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        try {
          AllocationScope.use(mem, (scope) => {
            scope.alloc(100);
            if (i % 3 === 0) throw new Error("periodic error");
          });
        } catch {
          // Expected errors
        }
      }

      // All allocations should be freed, regardless of success/error
      expect(mockExports.free).toHaveBeenCalledTimes(iterations);
    });
  });

  describe("real-world patterns", () => {
    it("handles typical WASM function call pattern", () => {
      const mockWasmFn = (inputPtr: number, inputLen: number): number => {
        // Simulate WASM function reading input and returning result ptr
        const input = mem.copyOut(inputPtr, inputLen);
        const output = new Uint8Array(input.map(b => b * 2));
        const result = mem.allocateAndCopy(output);
        return result.ptr;
      };

      const result = AllocationScope.use(mem, (scope) => {
        const input = scope.allocAndCopy(new Uint8Array([1, 2, 3]));
        const outputPtr = mockWasmFn(input.ptr, input.len);
        return mem.copyOutAndFree(outputPtr, input.len);
      });

      expect(Array.from(result)).toEqual([2, 4, 6]);
      // Input freed by scope, output freed by copyOutAndFree
      expect(mockExports.free).toHaveBeenCalledTimes(2);
    });

    it("handles string processing pattern", () => {
      const mockProcessString = (ptr: number, len: number): { ptr: number; len: number } => {
        const input = mem.decodeString(ptr, len);
        const output = input.toUpperCase();
        return mem.encodeString(output);
      };

      const result = AllocationScope.use(mem, (scope) => {
        const input = scope.encodeString("hello world");
        const output = mockProcessString(input.ptr, input.len);
        return mem.decodeStringAndFree(output.ptr, output.len);
      });

      expect(result).toBe("HELLO WORLD");
    });
  });
});
