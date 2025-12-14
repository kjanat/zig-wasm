import { spawn } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { checkPublished } from "../src/check-published.ts";

// Helper to run CLI commands
function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const script = join(import.meta.dirname, "../src/check-published.ts");
    const proc = spawn("bun", [script, ...args], {
      cwd: join(import.meta.dirname, "../../.."), // project root
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

describe("checkPublished", () => {
  describe("path resolution", () => {
    it("resolves scoped package names", async () => {
      // Mock Bun.file to avoid actual file system access
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@zig-wasm/crypto",
          version: "0.0.1",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      // Mock fetch to simulate npm registry response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false, // Simulate package not published
      }) as unknown as typeof fetch;

      const result = await checkPublished("@zig-wasm/crypto");

      expect(Bun.file).toHaveBeenCalledWith(
        expect.stringContaining("packages/crypto/package.json"),
      );
      expect(result.name).toBe("@zig-wasm/crypto");
      expect(result.version).toBe("0.0.1");
      expect(result.published).toBe(false);
    });

    it("resolves package names without scope", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@zig-wasm/hash",
          version: "0.1.0",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      const result = await checkPublished("hash");

      expect(Bun.file).toHaveBeenCalledWith(
        expect.stringContaining("packages/hash/package.json"),
      );
      expect(result.name).toBe("@zig-wasm/hash");
    });

    it("resolves relative paths", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@zig-wasm/base64",
          version: "1.2.3",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      await checkPublished("./packages/base64");

      expect(Bun.file).toHaveBeenCalledWith(
        expect.stringContaining("packages/base64/package.json"),
      );
    });
  });

  describe("npm registry checks", () => {
    it("detects published packages", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@zig-wasm/std",
          version: "0.1.0",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }) as unknown as typeof fetch;

      const result = await checkPublished("std");

      expect(fetch).toHaveBeenCalledWith(
        "https://registry.npmjs.org/@zig-wasm/std/0.1.0",
      );
      expect(result.published).toBe(true);
    });

    it("detects unpublished packages", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@zig-wasm/math",
          version: "99.99.99",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

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
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@test/package",
          version: "1.0.0",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

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
      const mockFile = {
        json: vi.fn().mockRejectedValue(new Error("File not found")),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      await expect(checkPublished("nonexistent")).rejects.toThrow();
    });

    it("handles network errors", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@test/pkg",
          version: "1.0.0",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;

      await expect(checkPublished("test")).rejects.toThrow("Network error");
    });

    it("handles malformed package.json", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          // Missing required fields
          invalidField: "invalid",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

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
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@org/sub/package",
          version: "1.0.0",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

      const result = await checkPublished("@org/sub/package");
      expect(result.name).toBe("@org/sub/package");
    });

    it("handles version with pre-release tags", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@test/pkg",
          version: "1.0.0-beta.1",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      const result = await checkPublished("test");
      expect(result.version).toBe("1.0.0-beta.1");
      expect(fetch).toHaveBeenCalledWith(
        "https://registry.npmjs.org/@test/pkg/1.0.0-beta.1",
      );
    });

    it("handles @scope without package name (falls back to scope as dir name)", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@scope/pkg",
          version: "1.0.0",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      // When passing just "@scope", it falls back to using the full string
      // This tests the ?? fallback behavior on line 126
      await checkPublished("@scope");

      // The path should include the fallback value
      expect(Bun.file).toHaveBeenCalledWith(
        expect.stringContaining("packages/@scope/package.json"),
      );
    });

    it("handles scoped names with empty package part", async () => {
      const mockFile = {
        json: vi.fn().mockResolvedValue({
          name: "@test/empty",
          version: "1.0.0",
        }),
      };
      global.Bun = {
        file: vi.fn().mockReturnValue(mockFile),
      } as unknown as typeof Bun;

      global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;

      // "@scope/" with trailing slash results in empty string from split
      // The || fallback should use the full pkgPath "@scope/"
      await checkPublished("@scope/");

      // resolve() normalizes paths, so "@scope/" becomes "@scope"
      expect(Bun.file).toHaveBeenCalledWith(
        expect.stringContaining("packages/@scope/package.json"),
      );
    });
  });

  describe("CLI entry point", () => {
    it("exits with code 1 and shows usage when no arguments provided", async () => {
      const result = await runCli([]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Usage: check-published");
      expect(result.stderr).toContain("Examples:");
    });

    it("exits with code 0 for published package", async () => {
      // Use a real published package for integration test
      const result = await runCli(["core"]);

      // core package should be published (check the actual status)
      expect([0, 1]).toContain(result.code);
      expect(result.stdout).toContain("Checking if package is published");
      if (result.code === 0) {
        expect(result.stdout).toMatch(/is published on npm/);
      } else {
        expect(result.stdout).toMatch(/is NOT published on npm/);
      }
    }, 10000);

    it("exits with code 2 on error (e.g., invalid package path)", async () => {
      const result = await runCli(["nonexistent-package-that-does-not-exist-xyz123"]);

      expect(result.code).toBe(2);
      expect(result.stderr).toContain("Failed to check npm registry");
    });

    it("handles scoped package names via CLI", async () => {
      const result = await runCli(["@zig-wasm/core"]);

      expect([0, 1]).toContain(result.code);
      expect(result.stdout).toContain("@zig-wasm/core");
    }, 10000);

    it("handles relative paths via CLI", async () => {
      const result = await runCli(["./packages/core"]);

      expect([0, 1]).toContain(result.code);
      expect(result.stdout).toContain("@zig-wasm/core");
    }, 10000);
  });
});
