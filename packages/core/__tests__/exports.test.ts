import * as core from "@zig-wasm/core";
import { describe, expect, it } from "vitest";

describe("@zig-wasm/core exports", () => {
  it("exposes environment helpers", () => {
    expect(core.detectEnvironment).toBeTypeOf("function");
    expect(core.getEnvironment).toBeTypeOf("function");
  });

  it("exposes wasm loader utilities", () => {
    expect(core.loadWasm).toBeTypeOf("function");
    expect(core.createModuleLoader).toBeTypeOf("function");
    expect(core.createWasmModule).toBeTypeOf("function");
    expect(core.resolveWasmPath).toBeTypeOf("function");
    expect(core.resolveWasmPathForNode).toBeTypeOf("function");
    expect(core.resolveWasmUrlForBrowser).toBeTypeOf("function");
    expect(core.defaultFetchFn).toBeTypeOf("function");
  });

  it("exposes memory helpers", () => {
    expect(core.AllocationScope).toBeTypeOf("function");
    expect(core.WasmMemory).toBeTypeOf("function");
  });

  it("exposes utility functions", () => {
    expect(core.toHex).toBeTypeOf("function");
    expect(core.fromHex).toBeTypeOf("function");
    expect(core.compareBytes).toBeTypeOf("function");
    expect(core.concatBytes).toBeTypeOf("function");
    expect(core.stringToBytes).toBeTypeOf("function");
    expect(core.bytesToString).toBeTypeOf("function");
  });

  it("exposes error types", () => {
    expect(core.ZigWasmError).toBeTypeOf("function");
    expect(core.NotInitializedError).toBeTypeOf("function");
    expect(core.WasmLoadError).toBeTypeOf("function");
    expect(core.WasmMemoryError).toBeTypeOf("function");
  });

  it("error hierarchy is correct", () => {
    expect(new core.NotInitializedError("test")).toBeInstanceOf(core.ZigWasmError);
    expect(new core.WasmLoadError("test")).toBeInstanceOf(core.ZigWasmError);
    expect(new core.WasmMemoryError("test")).toBeInstanceOf(core.ZigWasmError);
    expect(new core.ZigWasmError("test")).toBeInstanceOf(Error);
  });

  it("WasmLoadError preserves cause", () => {
    const cause = new Error("original error");
    const error = new core.WasmLoadError("test", cause);
    expect(error.cause).toBe(cause);
    expect(error.message).toContain("original error");
  });
});
