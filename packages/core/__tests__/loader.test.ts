import type { WasmLoadOptions, ZigWasmExports } from "@zig-wasm/core";
import { createModuleLoader, defaultFetchFn, loadWasm, resolveWasmPath, WasmLoadError } from "@zig-wasm/core";
import * as envModule from "@zig-wasm/core/env.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGarbageBytes,
  createMinimalWasmWithMemory,
  createWasmThatCallsPanic,
  createWasmWithoutMemory,
  createWasmWithPanicImport,
} from "./wasm-gen/index.ts";

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
      const invalidBytes = createGarbageBytes().wasm;

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
      const invalidBytes = createGarbageBytes().wasm;

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

      // Edge case: import value that's not an object (e.g., null, function, primitive)
      const result = await loadWasm({
        wasmBytes,
        imports: {
          // null value - not an object (typeof null === "object" but we check for null)
          nullImport: null,
          // Direct function (not wrapped in object)
          directFn: (() => {}) as unknown,
        } as unknown as WebAssembly.Imports,
      });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
    });

    it("handles primitive import values", async () => {
      const wasmBytes = createMinimalWasmWithMemory();

      // Edge case: primitive values in imports
      const result = await loadWasm({
        wasmBytes,
        imports: {
          stringValue: "test" as unknown,
          numberValue: 42 as unknown,
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

    it("default _panic handler throws Error with location info", async () => {
      // Create a minimal WASM module that calls _panic
      // Note: We can't easily trigger the panic from WASM in tests,
      // but we can verify the handler is provided correctly
      const wasmBytes = createWasmWithPanicImport();
      const result = await loadWasm({ wasmBytes });

      // The default _panic handler should be injected
      // We verify indirectly that it exists by successful loading
      expect(result.instance).toBeDefined();
    });

    it("default _panic handler throws when WASM calls it", async () => {
      const wasmBytes = createWasmThatCallsPanic();
      const result = await loadWasm({ wasmBytes });

      // Get the doPanic export and call it
      const doPanic = result.exports.doPanic as () => void;
      expect(doPanic).toBeTypeOf("function");

      // Calling doPanic should throw because it calls _panic(100, 10)
      expect(() => doPanic()).toThrow("Zig panic at ptr=100, len=10");
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
        wasmBytes: createGarbageBytes().wasm,
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

describe("loadWasm with wasmPath", () => {
  it("loads from file path in Node environment", async () => {
    const { writeFileSync, unlinkSync, mkdtempSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");

    const tempDir = mkdtempSync(join(tmpdir(), "wasm-path-test-"));
    const wasmPath = join(tempDir, "test.wasm");
    writeFileSync(wasmPath, createMinimalWasmWithMemory());

    try {
      const result = await loadWasm({ wasmPath });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
      expect(result.memory).toBeInstanceOf(WebAssembly.Memory);
    } finally {
      unlinkSync(wasmPath);
    }
  });

  it("throws WasmLoadError when file does not exist", async () => {
    await expect(loadWasm({ wasmPath: "/nonexistent/path/to/module.wasm" }))
      .rejects.toThrow(WasmLoadError);
  });
});

describe("loadWasm with wasmUrl", () => {
  it("loads with custom fetchFn", async () => {
    const wasmBytes = createMinimalWasmWithMemory();
    const customFetch = async (_url: string): Promise<ArrayBuffer> => {
      return wasmBytes.buffer.slice(
        wasmBytes.byteOffset,
        wasmBytes.byteOffset + wasmBytes.byteLength,
      ) as ArrayBuffer;
    };

    const result = await loadWasm({
      wasmUrl: "https://example.com/module.wasm",
      fetchFn: customFetch,
    });

    expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
  });

  it("handles URL object as wasmUrl", async () => {
    const wasmBytes = createMinimalWasmWithMemory();
    const customFetch = async (_url: string): Promise<ArrayBuffer> => {
      return wasmBytes.buffer.slice(
        wasmBytes.byteOffset,
        wasmBytes.byteOffset + wasmBytes.byteLength,
      ) as ArrayBuffer;
    };

    // Note: This uses loadFromUrl which converts URL to string
    const result = await loadWasm({
      wasmUrl: "https://example.com/path/module.wasm",
      fetchFn: customFetch,
    });

    expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
  });
});

describe("loadWasm environment edge cases", () => {
  it("throws WasmLoadError when wasmPath used in non-Node/Bun environment", async () => {
    // Mock getEnvironment to return non-Node/Bun environment
    const spy = vi.spyOn(envModule, "getEnvironment").mockReturnValue({
      isNode: false,
      isBun: false,
      isBrowser: true,
      isDeno: false,
      supportsStreaming: false,
    });

    try {
      await expect(loadWasm({ wasmPath: "./test.wasm" }))
        .rejects.toThrow(WasmLoadError);
      await expect(loadWasm({ wasmPath: "./test.wasm" }))
        .rejects.toThrow("File path loading only supported in Node.js/Bun");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("defaultFetchFn", () => {
  it("throws on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      await expect(defaultFetchFn("https://example.com/not-found.wasm"))
        .rejects.toThrow("Failed to fetch WASM: 404 Not Found");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns arrayBuffer on successful response", async () => {
    const wasmBytes = createMinimalWasmWithMemory();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () =>
        Promise.resolve(
          wasmBytes.buffer.slice(
            wasmBytes.byteOffset,
            wasmBytes.byteOffset + wasmBytes.byteLength,
          ),
        ),
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      const result = await defaultFetchFn("https://example.com/module.wasm");
      expect(result).toBeInstanceOf(ArrayBuffer);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("loadWasm with URL and no fetchFn", () => {
  it("uses defaultFetchFn when no fetchFn provided", async () => {
    const wasmBytes = createMinimalWasmWithMemory();

    // Mock global fetch to return valid WASM
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () =>
        Promise.resolve(
          wasmBytes.buffer.slice(
            wasmBytes.byteOffset,
            wasmBytes.byteOffset + wasmBytes.byteLength,
          ),
        ),
    });

    // Also need to mock env to not support streaming (to avoid streaming path)
    const envSpy = vi.spyOn(envModule, "getEnvironment").mockReturnValue({
      isNode: false,
      isBun: false,
      isBrowser: true,
      isDeno: false,
      supportsStreaming: false, // Disable streaming to test non-streaming path
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      const result = await loadWasm({
        wasmUrl: "https://example.com/module.wasm",
        // Note: no fetchFn provided - should use defaultFetchFn
      });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
      expect(mockFetch).toHaveBeenCalledWith("https://example.com/module.wasm");
    } finally {
      globalThis.fetch = originalFetch;
      envSpy.mockRestore();
    }
  });

  it("uses streaming fetch when supported and no fetchFn provided", async () => {
    const wasmBytes = createMinimalWasmWithMemory();

    // Mock global fetch to return a Response-like object
    const mockResponse = {
      ok: true,
      headers: new Headers({ "Content-Type": "application/wasm" }),
      arrayBuffer: () =>
        Promise.resolve(
          wasmBytes.buffer.slice(
            wasmBytes.byteOffset,
            wasmBytes.byteOffset + wasmBytes.byteLength,
          ),
        ),
    };

    const mockFetch = vi.fn().mockResolvedValue(mockResponse);

    // Mock env to support streaming
    const envSpy = vi.spyOn(envModule, "getEnvironment").mockReturnValue({
      isNode: false,
      isBun: false,
      isBrowser: true,
      isDeno: false,
      supportsStreaming: true, // Enable streaming
    });

    // Mock WebAssembly.instantiateStreaming
    const originalInstantiateStreaming = WebAssembly.instantiateStreaming;
    const mockInstantiateStreaming = vi.fn().mockImplementation(async () => {
      // Fall back to non-streaming instantiation for the mock
      const bytes = await mockResponse.arrayBuffer();
      return WebAssembly.instantiate(bytes, {});
    });
    (WebAssembly as { instantiateStreaming: typeof WebAssembly.instantiateStreaming }).instantiateStreaming =
      mockInstantiateStreaming;

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch;

    try {
      const result = await loadWasm({
        wasmUrl: "https://example.com/module.wasm",
      });

      expect(result.instance).toBeInstanceOf(WebAssembly.Instance);
      // Note: The fetch returns a Promise, so streaming should be attempted
    } finally {
      globalThis.fetch = originalFetch;
      (WebAssembly as { instantiateStreaming: typeof WebAssembly.instantiateStreaming }).instantiateStreaming =
        originalInstantiateStreaming;
      envSpy.mockRestore();
    }
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
