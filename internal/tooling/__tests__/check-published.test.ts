import { checkPublished, checkPublishedCli, findMonorepoRoot } from "@zig-wasm/tooling";
import { runCli } from "@zig-wasm/tooling/cli.ts";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock fs/promises.readFile
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

// Mock printHelp to suppress CLI output during tests
vi.mock("@zig-wasm/tooling/messages.ts", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@zig-wasm/tooling/messages.ts")>();
  return {
    ...mod,
    printHelp: vi.fn(),
  };
});

import { readFile } from "node:fs/promises";

describe("checkPublished", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalArgv: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    originalArgv = process.argv;
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.resetModules();
  });

  describe("path resolution", () => {
    it("resolves scoped package names", async () => {
      // Mock readFile to avoid actual file system access
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@zig-wasm/crypto",
          version: "0.0.1",
        }),
      );

      // Mock fetch to simulate npm registry response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false, // Simulate package not published
      }) as unknown as typeof fetch;

      const result = await checkPublished("@zig-wasm/crypto");

      expect(mockRead).toHaveBeenCalledWith(
        expect.stringContaining("packages/crypto/package.json"),
        "utf-8",
      );
      expect(result.name).toBe("@zig-wasm/crypto");
      expect(result.version).toBe("0.0.1");
      expect(result.published).toBe(false);
    });

    it("resolves package names without scope", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@zig-wasm/hash",
          version: "0.1.0",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      const result = await checkPublished("hash");

      expect(mockRead).toHaveBeenCalledWith(
        expect.stringContaining("packages/hash/package.json"),
        "utf-8",
      );
      expect(result.name).toBe("@zig-wasm/hash");
    });

    it("resolves relative paths", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@zig-wasm/base64",
          version: "1.2.3",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      await checkPublished("./packages/base64");

      expect(mockRead).toHaveBeenCalledWith(
        expect.stringContaining("packages/base64/package.json"),
        "utf-8",
      );
    });

    it("walks up to pnpm-workspace.yaml to find monorepo root", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@zig-wasm/hash",
          version: "1.2.3",
        }),
      );

      // Create a temporary workspace with a nested cwd
      const workspaceRoot = fs.mkdtempSync(join(tmpdir(), "check-published-"));
      const nestedCwd = join(workspaceRoot, "nested", "child");
      fs.mkdirSync(nestedCwd, { recursive: true });
      fs.writeFileSync(join(workspaceRoot, "pnpm-workspace.yaml"), "packages: []");

      const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(nestedCwd);
      try {
        global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

        const result = await checkPublished("hash");

        expect(result.name).toBe("@zig-wasm/hash");
        expect(mockRead).toHaveBeenCalledWith(
          join(workspaceRoot, "packages", "hash", "package.json"),
          "utf-8",
        );
      } finally {
        cwdSpy.mockRestore();
        fs.rmSync(workspaceRoot, { recursive: true, force: true });
      }
    });
  });

  describe("monorepo root detection", () => {
    it("throws when pnpm-workspace.yaml is missing", () => {
      const tmp = fs.mkdtempSync(join(tmpdir(), "monorepo-root-missing-"));
      try {
        expect(() => findMonorepoRoot(tmp)).toThrow(
          "Could not find pnpm-workspace.yaml. Run this script from within the monorepo.",
        );
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    });

    it("finds workspace when marker exists in start dir", () => {
      const tmp = fs.mkdtempSync(join(tmpdir(), "monorepo-root-found-"));
      try {
        fs.writeFileSync(join(tmp, "pnpm-workspace.yaml"), "packages: []");

        expect(findMonorepoRoot(tmp)).toBe(tmp);
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  describe("npm registry checks", () => {
    it("detects published packages", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValue(
        JSON.stringify({
          name: "@zig-wasm/std",
          version: "0.1.0",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as unknown as typeof fetch;

      const result = await checkPublished("std");

      expect(fetch).toHaveBeenCalledWith(
        "https://registry.npmjs.org/@zig-wasm/std/0.1.0",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
      expect(result.published).toBe(true);
    });

    it("detects unpublished packages", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@zig-wasm/math",
          version: "99.99.99",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }) as unknown as typeof fetch;

      const result = await checkPublished("math");

      expect(result.published).toBe(false);
    });
  });

  describe("result structure", () => {
    it("returns correct result structure", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@test/package",
          version: "1.0.0",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      const result = await checkPublished("test");

      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("published");
      expect(typeof result.name).toBe("string");
      expect(typeof result.version).toBe("string");
      expect(typeof result.published).toBe("boolean");
    });
  });

  describe("error handling", () => {
    it("handles missing package.json gracefully", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockRejectedValue(new Error("File not found"));

      await expect(checkPublished("nonexistent")).rejects.toThrow();
    });

    it("handles network errors", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValue(
        JSON.stringify({
          name: "@test/pkg",
          version: "1.0.0",
        }),
      );

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

      await expect(checkPublished("test")).rejects.toThrow("Network error");
    });

    it("handles timeout (AbortError)", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValue(
        JSON.stringify({
          name: "@test/pkg",
          version: "1.0.0",
        }),
      );

      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortError) as unknown as typeof fetch;

      await expect(checkPublished("test")).rejects.toThrow("Request timed out checking @test/pkg@1.0.0");
    });

    it("handles malformed package.json", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValue(
        JSON.stringify({
          // Missing required fields
          invalidField: "invalid",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      // Should still call fetch with undefined values
      await expect(
        checkPublished("test").then((r) => {
          expect(r.name).toBeUndefined();
          expect(r.version).toBeUndefined();
        }),
      ).resolves.not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("handles packages with multiple slashes in scope", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValue(
        JSON.stringify({
          name: "@org/sub/package",
          version: "1.0.0",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

      const result = await checkPublished("@org/sub/package");
      expect(result.name).toBe("@org/sub/package");
    });

    it("handles version with pre-release tags", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValue(
        JSON.stringify({
          name: "@test/pkg",
          version: "1.0.0-beta.1",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      const result = await checkPublished("test");
      expect(result.version).toBe("1.0.0-beta.1");
      expect(fetch).toHaveBeenCalledWith(
        "https://registry.npmjs.org/@test/pkg/1.0.0-beta.1",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it("handles @scope without package name (falls back to scope as dir name)", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@scope/pkg",
          version: "1.0.0",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      // When passing just "@scope", it falls back to using the full string
      // This tests the ?? fallback behavior on line 126
      await checkPublished("@scope");

      // The path should include the fallback value
      expect(mockRead).toHaveBeenCalledWith(
        expect.stringContaining("packages/@scope/package.json"),
        "utf-8",
      );
    });

    it("handles scoped names with empty package part", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@test/empty",
          version: "1.0.0",
        }),
      );

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      // "@scope/" with trailing slash results in empty string from split
      // The || fallback should use the full pkgPath "@scope/"
      await checkPublished("@scope/");

      // resolve() normalizes paths, so "@scope/" becomes "@scope"
      expect(mockRead).toHaveBeenCalledWith(
        expect.stringContaining("packages/@scope/package.json"),
        "utf-8",
      );
    });
  });

  describe("CLI handler (checkPublishedCli)", () => {
    it("returns 0 when --help is provided", async () => {
      process.argv = ["node", "check-published.ts", "--help"];

      const exitCode = await checkPublishedCli();

      expect(exitCode).toBe(0);
    });

    it("returns 0 when -h is provided", async () => {
      process.argv = ["node", "check-published.ts", "-h"];

      const exitCode = await checkPublishedCli();

      expect(exitCode).toBe(0);
    });

    it("returns 2 when no arguments provided", async () => {
      process.argv = ["node", "check-published.ts"];

      const exitCode = await checkPublishedCli();

      expect(exitCode).toBe(2);
    });

    it("returns 0 for published package", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@zig-wasm/core",
          version: "1.0.0",
        }),
      );
      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      process.argv = ["node", "check-published.ts", "core"];

      const exitCode = await checkPublishedCli();

      expect(exitCode).toBe(0);
      expect(consoleLogSpy).toHaveBeenCalledWith("Checking if package is published...");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("is published on npm"));
    });

    it("returns 1 for unpublished package", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockResolvedValueOnce(
        JSON.stringify({
          name: "@zig-wasm/core",
          version: "99.99.99",
        }),
      );
      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

      process.argv = ["node", "check-published.ts", "core"];

      const exitCode = await checkPublishedCli();

      expect(exitCode).toBe(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("is NOT published on npm"));
    });

    it("returns 2 on error", async () => {
      const mockRead = vi.mocked(readFile);
      mockRead.mockRejectedValueOnce(new Error("File not found"));

      process.argv = ["node", "check-published.ts", "nonexistent"];

      const exitCode = await checkPublishedCli();

      expect(exitCode).toBe(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to check npm registry:", expect.any(Error));
    });
  });
});

describe("runCli", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalExitCode: typeof process.exitCode;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    originalExitCode = process.exitCode;
    process.exitCode = undefined;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    process.exitCode = originalExitCode;
  });

  it("sets process.exitCode to returned value on success", async () => {
    await runCli(async () => 0);
    expect(process.exitCode).toBe(0);

    await runCli(async () => 1);
    expect(process.exitCode).toBe(1);
  });

  it("sets process.exitCode to 2 and logs error on exception", async () => {
    const testError = new Error("Test failure");

    await runCli(async () => {
      throw testError;
    });

    expect(process.exitCode).toBe(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
  });
});
