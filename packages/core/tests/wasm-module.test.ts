import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WasmModule, ZigWasmExports } from "../src/index.ts";
import {
  createWasmModule,
  NotInitializedError,
  resolveWasmPathForNode,
  resolveWasmUrlForBrowser,
} from "../src/wasm-module.ts";
import { createMinimalWasmWithMemory } from "./test-utils.ts";

// Mock WASM exports for testing
interface TestExports extends ZigWasmExports {
  testFunction?: (x: number) => number;
}

describe("createWasmModule", () => {
  let module: WasmModule<TestExports>;

  beforeEach(() => {
    module = createWasmModule<TestExports>({
      name: "test-module",
      wasmFileName: "test.wasm",
    });
  });

  describe("initialization state", () => {
    it("starts uninitialized", () => {
      expect(module.isInitialized()).toBe(false);
    });

    it("throws NotInitializedError when accessing exports before init", () => {
      expect(() => module.getExports()).toThrow(NotInitializedError);
      expect(() => module.getExports()).toThrow(
        "test-module WASM module not initialized",
      );
    });

    it("throws NotInitializedError when accessing memory before init", () => {
      expect(() => module.getMemory()).toThrow(NotInitializedError);
      expect(() => module.getMemory()).toThrow(
        "test-module WASM module not initialized",
      );
    });

    it("NotInitializedError has correct name", () => {
      try {
        module.getExports();
      } catch (err) {
        expect(err).toBeInstanceOf(NotInitializedError);
        expect((err as Error).name).toBe("NotInitializedError");
      }
    });

    it("NotInitializedError includes module name", () => {
      const customModule = createWasmModule({
        name: "custom-name",
        wasmFileName: "custom.wasm",
      });

      expect(() => customModule.getExports()).toThrow("custom-name WASM module not initialized");
    });
  });

  describe("successful initialization", () => {
    it("initializes with wasmBytes", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      await module.init({ wasmBytes });

      expect(module.isInitialized()).toBe(true);
    });

    it("getExports returns exports after init", async () => {
      const wasmBytes = createMinimalWasmWithMemory();
      await module.init({ wasmBytes });

      const exports = module.getExports();

      expect(exports).toBeDefined();
      expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
    });

    it("getMemory returns WasmMemory after init", async () => {
      const wasmBytes = createMinimalWasmWithMemory();
      await module.init({ wasmBytes });

      const memory = module.getMemory();

      expect(memory).toBeDefined();
      expect(memory.getView).toBeTypeOf("function");
      expect(memory.allocate).toBeTypeOf("function");
    });

    it("init is idempotent - second call returns immediately", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      await module.init({ wasmBytes });
      const exports1 = module.getExports();

      // Second init should be no-op
      await module.init({ wasmBytes });
      const exports2 = module.getExports();

      expect(exports1).toBe(exports2);
    });
  });

  describe("ensureInitialized", () => {
    it("initializes and returns exports and memory", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      const { exports, memory } = await module.ensureInitialized({ wasmBytes });

      expect(exports).toBeDefined();
      expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
      expect(memory).toBeDefined();
    });

    it("is idempotent - multiple calls return same result", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      const result1 = await module.ensureInitialized({ wasmBytes });
      const result2 = await module.ensureInitialized({ wasmBytes });

      expect(result1.exports).toBe(result2.exports);
    });

    it("can be called without options after first init", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      await module.init({ wasmBytes });
      const { exports, memory } = await module.ensureInitialized();

      expect(exports).toBeDefined();
      expect(memory).toBeDefined();
    });
  });

  describe("concurrent initialization", () => {
    it("handles concurrent init calls safely", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      // Start multiple inits concurrently
      const promises = [
        module.init({ wasmBytes }),
        module.init({ wasmBytes }),
        module.init({ wasmBytes }),
      ];

      await Promise.all(promises);

      expect(module.isInitialized()).toBe(true);
      // All should resolve to the same instance
      const exports = module.getExports();
      expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
    });

    it("handles concurrent ensureInitialized calls", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      const promises = [
        module.ensureInitialized({ wasmBytes }),
        module.ensureInitialized({ wasmBytes }),
        module.ensureInitialized({ wasmBytes }),
      ];

      const results = await Promise.all(promises);

      // All should return the same exports
      expect(results[0].exports).toBe(results[1].exports);
      expect(results[1].exports).toBe(results[2].exports);
    });
  });

  describe("init options", () => {
    it("accepts wasmBytes option", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      await module.init({ wasmBytes });

      expect(module.isInitialized()).toBe(true);
    });

    it("accepts custom imports", async () => {
      const wasmBytes = createMinimalWasmWithMemory();
      const customFn = vi.fn();

      await module.init({
        wasmBytes,
        imports: {
          custom: { fn: customFn },
        },
      });

      expect(module.isInitialized()).toBe(true);
    });

    it("accepts custom fetchFn", async () => {
      const wasmBytes = createMinimalWasmWithMemory();
      const customFetch = vi.fn();

      // Using wasmBytes, fetchFn won't be called but should be accepted
      await module.init({
        wasmBytes,
        fetchFn: customFetch,
      });

      expect(module.isInitialized()).toBe(true);
    });
  });

  describe("API surface", () => {
    it("provides init method", () => {
      expect(module.init).toBeTypeOf("function");
    });

    it("provides isInitialized method", () => {
      expect(module.isInitialized).toBeTypeOf("function");
    });

    it("provides getExports method", () => {
      expect(module.getExports).toBeTypeOf("function");
    });

    it("provides getMemory method", () => {
      expect(module.getMemory).toBeTypeOf("function");
    });

    it("provides ensureInitialized method", () => {
      expect(module.ensureInitialized).toBeTypeOf("function");
    });
  });

  describe("multiple module instances", () => {
    it("different module instances are independent", () => {
      const module1 = createWasmModule<TestExports>({
        name: "module1",
        wasmFileName: "test1.wasm",
      });

      const module2 = createWasmModule<TestExports>({
        name: "module2",
        wasmFileName: "test2.wasm",
      });

      expect(module1.isInitialized()).toBe(false);
      expect(module2.isInitialized()).toBe(false);
      expect(module1).not.toBe(module2);
    });

    it("each module maintains its own state", async () => {
      const module1 = createWasmModule<TestExports>({
        name: "module1",
        wasmFileName: "test1.wasm",
      });

      const module2 = createWasmModule<TestExports>({
        name: "module2",
        wasmFileName: "test2.wasm",
      });

      const wasmBytes = createMinimalWasmWithMemory();
      await module1.init({ wasmBytes });

      expect(module1.isInitialized()).toBe(true);
      expect(module2.isInitialized()).toBe(false);
    });

    it("each module throws different error messages", () => {
      const module1 = createWasmModule({
        name: "module1",
        wasmFileName: "test1.wasm",
      });

      const module2 = createWasmModule({
        name: "module2",
        wasmFileName: "test2.wasm",
      });

      try {
        module1.getExports();
      } catch (err) {
        expect((err as Error).message).toContain("module1");
      }

      try {
        module2.getExports();
      } catch (err) {
        expect((err as Error).message).toContain("module2");
      }
    });
  });
});

describe("path resolution helpers", () => {
  describe("resolveWasmUrlForBrowser", () => {
    it("resolves relative path from import.meta.url", () => {
      const importUrl = "https://example.com/dist/module.js";
      const wasmFile = "crypto.wasm";

      const result = resolveWasmUrlForBrowser(importUrl, wasmFile);

      expect(result).toBe("https://example.com/dist/crypto.wasm");
    });

    it("handles nested paths", () => {
      const importUrl = "https://example.com/assets/js/app.js";
      const wasmFile = "../wasm/hash.wasm";

      const result = resolveWasmUrlForBrowser(importUrl, wasmFile);

      expect(result).toBe("https://example.com/assets/wasm/hash.wasm");
    });

    it("handles absolute-like paths", () => {
      const importUrl = "https://example.com/module.js";
      const wasmFile = "/absolute/path.wasm";

      const result = resolveWasmUrlForBrowser(importUrl, wasmFile);

      expect(result).toBe("https://example.com/absolute/path.wasm");
    });

    it("preserves URL components", () => {
      const importUrl = "https://cdn.example.com:8080/lib/module.js?v=1";
      const wasmFile = "crypto.wasm";

      const result = resolveWasmUrlForBrowser(importUrl, wasmFile);

      expect(result).toContain("https://cdn.example.com:8080/lib/crypto.wasm");
    });

    it("handles file:// URLs", () => {
      const importUrl = "file:///home/user/project/module.js";
      const wasmFile = "module.wasm";

      const result = resolveWasmUrlForBrowser(importUrl, wasmFile);

      expect(result).toBe("file:///home/user/project/module.wasm");
    });
  });

  describe("resolveWasmPathForNode", () => {
    it("resolves path from file:// URL", async () => {
      const importUrl = "file:///home/user/project/dist/module.js";
      const wasmFile = "crypto.wasm";

      const result = await resolveWasmPathForNode(importUrl, wasmFile);

      // Should be absolute path joining directory of module with wasm file
      expect(result).toContain("crypto.wasm");
      expect(result).toContain("dist");
    });

    it("handles Windows-style paths", async () => {
      const importUrl = "file:///C:/Users/user/project/module.js";
      const wasmFile = "hash.wasm";

      const result = await resolveWasmPathForNode(importUrl, wasmFile);

      expect(result).toContain("hash.wasm");
    });

    it("resolves to sibling of module file", async () => {
      const importUrl = "file:///app/lib/module.js";
      const wasmFile = "module.wasm";

      const result = await resolveWasmPathForNode(importUrl, wasmFile);

      // Should be in same directory as module.js
      expect(result).toContain("lib");
      expect(result).toContain("module.wasm");
    });

    it("handles deeply nested paths", async () => {
      const importUrl = "file:///project/packages/core/dist/esm/index.js";
      const wasmFile = "core.wasm";

      const result = await resolveWasmPathForNode(importUrl, wasmFile);

      expect(result).toContain("esm");
      expect(result).toContain("core.wasm");
    });
  });
});

describe("NotInitializedError", () => {
  it("extends Error class", () => {
    const error = new NotInitializedError("test");
    expect(error).toBeInstanceOf(Error);
  });

  it("has correct error name", () => {
    const error = new NotInitializedError("test");
    expect(error.name).toBe("NotInitializedError");
  });

  it("includes module name in message", () => {
    const error = new NotInitializedError("my-module");
    expect(error.message).toContain("my-module");
  });

  it("provides initialization hint", () => {
    const error = new NotInitializedError("test");
    expect(error.message).toContain("Call init()");
  });

  it("mentions async API alternative", () => {
    const error = new NotInitializedError("test");
    expect(error.message).toContain("async API");
  });
});

describe("type safety", () => {
  it("WasmModule is correctly typed", () => {
    const module = createWasmModule<TestExports>({
      name: "test",
      wasmFileName: "test.wasm",
    });

    // TypeScript compile-time checks
    expect(module.init).toBeTypeOf("function");
    expect(module.isInitialized).toBeTypeOf("function");
    expect(module.getExports).toBeTypeOf("function");
    expect(module.getMemory).toBeTypeOf("function");
    expect(module.ensureInitialized).toBeTypeOf("function");
  });

  it("exports are properly typed after init", async () => {
    const module = createWasmModule<TestExports>({
      name: "test",
      wasmFileName: "test.wasm",
    });

    await module.init({ wasmBytes: createMinimalWasmWithMemory() });

    const exports = module.getExports();
    // Should have memory from ZigWasmExports
    expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
  });
});

describe("WasmMemory integration", () => {
  it("getMemory returns WasmMemory instance", async () => {
    const module = createWasmModule<TestExports>({
      name: "test",
      wasmFileName: "test.wasm",
    });

    await module.init({ wasmBytes: createMinimalWasmWithMemory() });

    const memory = module.getMemory();

    // Memory should have the expected properties/methods
    expect(memory).toBeDefined();
    expect(memory.buffer).toBeInstanceOf(ArrayBuffer);
    expect(memory.view).toBeInstanceOf(Uint8Array);
  });

  it("memory buffer provides access to linear memory", async () => {
    const module = createWasmModule<TestExports>({
      name: "test",
      wasmFileName: "test.wasm",
    });

    await module.init({ wasmBytes: createMinimalWasmWithMemory() });

    const memory = module.getMemory();

    // Buffer should be 1 page (64KB) as defined in minimal WASM
    expect(memory.buffer.byteLength).toBe(65536);
  });

  it("memory view allows direct memory access", async () => {
    const module = createWasmModule<TestExports>({
      name: "test",
      wasmFileName: "test.wasm",
    });

    await module.init({ wasmBytes: createMinimalWasmWithMemory() });

    const memory = module.getMemory();

    // Can write to and read from memory directly
    const view = memory.view;
    view[100] = 42;
    expect(view[100]).toBe(42);
  });
});
