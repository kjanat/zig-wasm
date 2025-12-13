import { beforeEach, describe, expect, it } from "vitest";
import type { WasmModule, ZigWasmExports } from "../src/index.ts";
import {
  createWasmModule,
  NotInitializedError,
  resolveWasmPathForNode,
  resolveWasmUrlForBrowser,
} from "../src/wasm-module.ts";

// Mock WASM exports for testing
interface TestExports extends ZigWasmExports {
  testFunction: (x: number) => number;
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

    it("each module maintains its own state", () => {
      const module1 = createWasmModule({
        name: "module1",
        wasmFileName: "test1.wasm",
      });

      const module2 = createWasmModule({
        name: "module2",
        wasmFileName: "test2.wasm",
      });

      expect(module1.isInitialized()).toBe(false);
      expect(module2.isInitialized()).toBe(false);

      // They should throw different error messages
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
});
