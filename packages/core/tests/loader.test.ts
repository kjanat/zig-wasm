import { beforeEach, describe, expect, it, vi } from "vitest";
import { createModuleLoader } from "../src/loader.ts";
import type { WasmLoadOptions } from "../src/types.ts";

/**
 * Note: Most loader.ts tests require actual WASM binaries which are complex to create
 * These tests focus on the caching and type safety aspects that can be tested without WASM
 */

describe("createModuleLoader", () => {
  let getWasmSource: () => WasmLoadOptions;

  beforeEach(() => {
    getWasmSource = vi.fn(() => ({
      wasmBytes: new Uint8Array([]), // Simplified - real tests would need valid WASM
    }));
  });

  describe("function creation", () => {
    it("returns a loader function", () => {
      const loader = createModuleLoader(getWasmSource);
      expect(loader).toBeTypeOf("function");
    });

    it("accepts a factory function", () => {
      const factory = () => ({ wasmBytes: new Uint8Array([]) });
      const loader = createModuleLoader(factory);
      expect(loader).toBeTypeOf("function");
    });
  });

  describe("caching behavior tracking", () => {
    it("tracks factory invocation", async () => {
      const loader = createModuleLoader(getWasmSource);

      // Note: This will fail without valid WASM, but we can verify the factory was called
      try {
        await loader();
      } catch {
        // Expected to fail with invalid WASM
      }

      expect(getWasmSource).toHaveBeenCalled();
    });

    it("only calls factory once even on concurrent requests", async () => {
      const loader = createModuleLoader(getWasmSource);

      const promises = [
        loader().catch(() => {}),
        loader().catch(() => {}),
        loader().catch(() => {}),
      ];

      await Promise.all(promises);

      // Should only be called once despite concurrent calls
      expect(getWasmSource).toHaveBeenCalledTimes(1);
    });
  });

  describe("error propagation", () => {
    it("propagates errors from loadWasm", async () => {
      // Factory doesn't throw, but loadWasm will fail with invalid WASM
      const loader = createModuleLoader(getWasmSource);

      // Should reject because wasmBytes is empty/invalid
      await expect(loader()).rejects.toThrow();
    });
  });
});

describe("loader type safety", () => {
  it("createModuleLoader is properly typed", () => {
    const factory = () => ({ wasmBytes: new Uint8Array([]) });
    const loader = createModuleLoader(factory);

    expect(loader).toBeTypeOf("function");
  });

  it("accepts WasmLoadOptions factory", () => {
    const options: WasmLoadOptions = {
      wasmBytes: new Uint8Array([]),
    };

    const loader = createModuleLoader(() => options);
    expect(loader).toBeTypeOf("function");
  });
});

describe("WasmLoadOptions validation", () => {
  it("factory can return wasmBytes", () => {
    const factory = () => ({ wasmBytes: new Uint8Array([1, 2, 3]) });
    const loader = createModuleLoader(factory);
    expect(loader).toBeTypeOf("function");
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

  it("factory can include custom imports", () => {
    const factory = () => ({
      wasmBytes: new Uint8Array([]),
      imports: {
        env: {
          customFn: () => {},
        },
      },
    });

    const loader = createModuleLoader(factory);
    expect(loader).toBeTypeOf("function");
  });
});
