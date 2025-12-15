import * as tooling from "@zig-wasm/tooling";
import { describe, expect, it } from "vitest";

describe("@zig-wasm/tooling exports", () => {
  it.skip("exposes version", () => {
    expect(tooling.VERSION).toBeTypeOf("string");
    expect(tooling.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("exposes helpers", () => {
    expect(tooling.checkPublished).toBeTypeOf("function");
    expect(tooling.syncVersions).toBeTypeOf("function");
  });

  it("exports TypeScript types", () => {
    // Type checking - these should compile without errors
    type CheckPublishedResultType = tooling.CheckPublishedResult;
    type SyncVersionsOptionsType = tooling.SyncVersionsOptions;
    type SyncVersionsResultType = tooling.SyncVersionsResult;

    const checkResult: CheckPublishedResultType = {
      name: "@test/pkg",
      version: "1.0.0",
      published: true,
    };

    const syncOptions: SyncVersionsOptionsType = {
      checkOnly: true,
      cwd: "/test/path",
    };

    const syncResult: SyncVersionsResultType = {
      success: true,
      mismatches: 0,
      synced: [],
    };

    expect(checkResult).toBeDefined();
    expect(syncOptions).toBeDefined();
    expect(syncResult).toBeDefined();
  });
});
