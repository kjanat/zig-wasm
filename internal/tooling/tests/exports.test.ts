import { describe, expect, it } from "vitest";
import * as tooling from "../src/index.ts";

describe("@zig-wasm/tooling exports", () => {
  it("exposes version and helpers", () => {
    expect(tooling.VERSION).toBeTypeOf("string");
    expect(tooling.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
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
