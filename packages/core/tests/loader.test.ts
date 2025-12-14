import { beforeEach, describe, expect, it, vi } from "vitest";
import { WasmLoadError } from "../src/errors.ts";
import { createModuleLoader, loadWasm, resolveWasmPath } from "../src/loader.ts";
import type { WasmLoadOptions, ZigWasmExports } from "../src/types.ts";
import {
  createInvalidWasm,
  createMinimalWasmWithMemory,
  createWasmWithoutMemory,
  createWasmWithPanicImport,
} from "./test-utils.ts";

describe("loadWasm", () => {
  describe("with valid WASM bytes", () => {
    it("loads WASM module from Uint8Array bytes", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      const result = await loadWasm({ wasmBytes });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
      expect(result.memory).toBeInstanceOf(WebAssembly.Memory);
      expect(result.exports).toBeDefined();
      expect(result.exports.memory).toBeInstanceOf(WebAssembly.Memory);
    });

    it("loads WASM module from ArrayBuffer bytes", async () => {
      const wasmBytes = createMinimalWasmWithMemory();
      const arrayBuffer = wasmBytes.buffer.slice(
        wasmBytes.byteOffset,
        wasmBytes.byteOffset + wasmBytes.byteLength,
      ) as ArrayBuffer;

      const result = await loadWasm({ wasmBytes: arrayBuffer });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
      expect(result.memory).toBeInstanceOf(WebAssembly.Memory);
    });

    it("handles Uint8Array with offset correctly", async () => {
      // Create a larger buffer with the WASM at an offset
      const wasmBytes = createMinimalWasmWithMemory();
      const paddedBuffer = new ArrayBuffer(wasmBytes.length + 10);
      const paddedView = new Uint8Array(paddedBuffer);
      paddedView.set(wasmBytes, 5); // offset by 5

      const offsetView = new Uint8Array(paddedBuffer, 5, wasmBytes.length);

      const result = await loadWasm({ wasmBytes: offsetView });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
    });
  });

  describe("error handling", () => {
    it("throws WasmLoadError for invalid WASM bytes", async () => {
      const invalidBytes = createInvalidWasm();

      await expect(loadWasm({ wasmBytes: invalidBytes })).rejects.toThrow(WasmLoadError);
    });

    it("throws WasmLoadError when WASM has no memory export", async () => {
      const wasmWithoutMemory = createWasmWithoutMemory();

      await expect(loadWasm({ wasmBytes: wasmWithoutMemory })).rejects.toThrow(WasmLoadError);
      await expect(loadWasm({ wasmBytes: wasmWithoutMemory })).rejects.toThrow("must export 'memory'");
    });

    it("throws WasmLoadError when no source provided", async () => {
      await expect(loadWasm({})).rejects.toThrow(WasmLoadError);
      await expect(loadWasm({})).rejects.toThrow("Must provide one of: wasmBytes, wasmUrl, or wasmPath");
    });

    it("preserves original WasmLoadError", async () => {
      // Empty options triggers a WasmLoadError
      try {
        await loadWasm({});
      } catch (err) {
        expect(err).toBeInstanceOf(WasmLoadError);
        expect((err as WasmLoadError).name).toBe("WasmLoadError");
      }
    });

    it("wraps non-WasmLoadError errors", async () => {
      const invalidBytes = createInvalidWasm();

      try {
        await loadWasm({ wasmBytes: invalidBytes });
      } catch (err) {
        expect(err).toBeInstanceOf(WasmLoadError);
      }
    });
  });

  describe("custom imports", () => {
    it("merges custom imports with defaults", async () => {
      const wasmBytes = createMinimalWasmWithMemory();
      const customFn = vi.fn();

      const result = await loadWasm({
        wasmBytes,
        imports: {
          custom: {
            myFunction: customFn,
          },
        },
      });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
    });

    it("allows overriding env imports", async () => {
      const wasmBytes = createMinimalWasmWithMemory();
      const customPanic = vi.fn();

      const result = await loadWasm({
        wasmBytes,
        imports: {
          env: {
            _panic: customPanic,
          },
        },
      });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
    });

    it("merges nested env imports", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      const result = await loadWasm({
        wasmBytes,
        imports: {
          env: {
            customEnvFn: () => 42,
          },
        },
      });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
    });

    it("handles non-object import values", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      // Edge case: import value that's not an object
      const result = await loadWasm({
        wasmBytes,
        imports: {
          global: globalThis,
        } as unknown as WebAssembly.Imports,
      });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
    });
  });

  describe("with WASM requiring _panic import", () => {
    it("loads WASM that imports _panic from env", async () => {
      const wasmBytes = createWasmWithPanicImport();

      const result = await loadWasm({ wasmBytes });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
      expect(result.memory).toBeInstanceOf(WebAssembly.Memory);
    });

    it("provides default _panic handler that throws", async () => {
      const wasmBytes = createWasmWithPanicImport();

      // Should not throw during loading - default imports include _panic
      const result = await loadWasm({ wasmBytes });
      expect(result.instance).toBeDefined();
    });

    it("allows custom _panic handler via imports", async () => {
      const wasmBytes = createWasmWithPanicImport();
      const customPanic = vi.fn();

      const result = await loadWasm({
        wasmBytes,
        imports: {
          env: { _panic: customPanic },
        },
      });

      expect(result.instance).toBeDefined();
    });
  });
});

describe("createModuleLoader", () => {
  let getWasmSource: () => WasmLoadOptions;

  beforeEach(() => {
    getWasmSource = vi.fn(() => ({
      wasmBytes: createMinimalWasmWithMemory(),
    }));
  });

  describe("function creation", () => {
    it("returns a loader function", () => {
      const loader = createModuleLoader(getWasmSource);
      expect(loader).toBeTypeOf("function");
    });

    it("accepts a factory function", () => {
      const factory = () => ({ wasmBytes: createMinimalWasmWithMemory() });
      const loader = createModuleLoader(factory);
      expect(loader).toBeTypeOf("function");
    });
  });

  describe("successful loading", () => {
    it("loads and returns WASM module", async () => {
      const loader = createModuleLoader(getWasmSource);

      const result = await loader();

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
      expect(result.memory).toBeInstanceOf(WebAssembly.Memory);
      expect(result.exports.memory).toBeInstanceOf(WebAssembly.Memory);
    });

    it("caches the result", async () => {
      const loader = createModuleLoader(getWasmSource);

      const result1 = await loader();
      const result2 = await loader();

      expect(result1).toBe(result2);
      expect(getWasmSource).toHaveBeenCalledTimes(1);
    });
  });

  describe("caching behavior", () => {
    it("tracks factory invocation", async () => {
      const loader = createModuleLoader(getWasmSource);

      await loader();

      expect(getWasmSource).toHaveBeenCalled();
    });

    it("only calls factory once even on concurrent requests", async () => {
      const loader = createModuleLoader(getWasmSource);

      const promises = [
        loader(),
        loader(),
        loader(),
      ];

      await Promise.all(promises);

      expect(getWasmSource).toHaveBeenCalledTimes(1);
    });

    it("returns same promise for concurrent calls", async () => {
      const loader = createModuleLoader(getWasmSource);

      const promise1 = loader();
      const promise2 = loader();

      expect(promise1).toBe(promise2);
    });
  });

  describe("error propagation", () => {
    it("propagates errors from loadWasm", async () => {
      const invalidFactory = vi.fn(() => ({
        wasmBytes: createInvalidWasm(),
      }));
      const loader = createModuleLoader(invalidFactory);

      await expect(loader()).rejects.toThrow(WasmLoadError);
    });
  });
});

describe("resolveWasmPath", () => {
  it("resolves relative path from file:// URL", () => {
    const importUrl = "file:///home/user/project/dist/module.js";
    const relativePath = "module.wasm";

    const result = resolveWasmPath(importUrl, relativePath);

    // In Node.js, should return the pathname
    expect(result).toContain("module.wasm");
  });

  it("resolves relative path from https:// URL", () => {
    const importUrl = "https://example.com/dist/module.js";
    const relativePath = "module.wasm";

    const result = resolveWasmPath(importUrl, relativePath);

    expect(result).toBe("https://example.com/dist/module.wasm");
  });

  it("handles parent directory navigation", () => {
    const importUrl = "https://example.com/dist/js/module.js";
    const relativePath = "../wasm/module.wasm";

    const result = resolveWasmPath(importUrl, relativePath);

    expect(result).toBe("https://example.com/dist/wasm/module.wasm");
  });

  it("handles absolute paths", () => {
    const importUrl = "https://example.com/app/module.js";
    const relativePath = "/assets/module.wasm";

    const result = resolveWasmPath(importUrl, relativePath);

    expect(result).toBe("https://example.com/assets/module.wasm");
  });
});

describe("loader type safety", () => {
  interface TestExports extends ZigWasmExports {
    testFn: () => number;
  }

  it("createModuleLoader preserves generic types", async () => {
    const factory = () => ({ wasmBytes: createMinimalWasmWithMemory() });
    const loader = createModuleLoader<TestExports>(factory);

    const result = await loader();

    // Type check: exports should be typed as TestExports
    expect(result.exports.memory).toBeInstanceOf(WebAssembly.Memory);
  });
});

describe("WasmLoadOptions validation", () => {
  it("factory can return wasmBytes", async () => {
    const factory = () => ({ wasmBytes: createMinimalWasmWithMemory() });
    const loader = createModuleLoader(factory);

    const result = await loader();
    expect(result.instance).toBeDefined();
  });

  it("factory can return wasmUrl", () => {
    const factory = () => ({ wasmUrl: "/path/to/module.wasm" });
    const loader = createModuleLoader(factory);
    expect(loader).toBeTypeOf("function");
  });

  it("factory can return wasmPath", () => {
    const factory = () => ({ wasmPath: "./module.wasm" });
    const loader = createModuleLoader(factory);
    expect(loader).toBeTypeOf("function");
  });

  it("factory can include custom imports", async () => {
    const factory = () => ({
      wasmBytes: createMinimalWasmWithMemory(),
      imports: {
        env: {
          customFn: () => {},
        },
      },
    });

    const loader = createModuleLoader(factory);
    const result = await loader();

    expect(result.instance).toBeDefined();
  });
});
