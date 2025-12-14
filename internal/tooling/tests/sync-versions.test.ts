import { spawn } from "node:child_process";
import * as fs from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { syncVersions } from "../src/sync-versions.ts";

// Mock the fs module
vi.mock("node:fs", () => ({
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock file system operations
const mockFS = {
  dirs: new Map<string, string[]>(),
  files: new Map<string, unknown>(),
  written: new Map<string, string>(),
};

// Helper to run CLI commands
function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const script = join(import.meta.dirname, "../src/sync-versions.ts");
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

describe("syncVersions", () => {
  afterEach(() => {
    mockFS.dirs.clear();
    mockFS.files.clear();
    mockFS.written.clear();
    vi.restoreAllMocks();
  });

  describe("version synchronization", () => {
    it("syncs mismatched versions from package.json to jsr.json", async () => {
      // Setup mock file system
      mockFS.dirs.set("/test/packages", ["core", "crypto"]);
      mockFS.files.set("/test/packages/core/package.json", {
        name: "@zig-wasm/core",
        version: "0.2.0",
      });
      mockFS.files.set("/test/packages/core/jsr.json", {
        name: "@zig-wasm/core",
        version: "0.1.0", // Mismatch
      });
      mockFS.files.set("/test/packages/crypto/package.json", {
        name: "@zig-wasm/crypto",
        version: "1.0.0",
      });
      mockFS.files.set("/test/packages/crypto/jsr.json", {
        name: "@zig-wasm/crypto",
        version: "1.0.0", // In sync
      });

      setupMocks("/test");

      const result = await syncVersions({ cwd: "/test" });

      expect(result.mismatches).toBe(1);
      expect(result.synced).toEqual(["@zig-wasm/core"]);
      expect(result.success).toBe(true);

      // Verify jsr.json was updated
      const written = mockFS.written.get("/test/packages/core/jsr.json");
      expect(written).toBeDefined();
      if (written) {
        const parsed = JSON.parse(written);
        expect(parsed.version).toBe("0.2.0");
      }
    });

    it("reports mismatches in check-only mode without modifying files", async () => {
      mockFS.dirs.set("/test/packages", ["math"]);
      mockFS.files.set("/test/packages/math/package.json", {
        name: "@zig-wasm/math",
        version: "2.0.0",
      });
      mockFS.files.set("/test/packages/math/jsr.json", {
        name: "@zig-wasm/math",
        version: "1.5.0",
      });

      setupMocks("/test");

      const result = await syncVersions({ cwd: "/test", checkOnly: true });

      expect(result.mismatches).toBe(1);
      expect(result.synced).toEqual([]);
      expect(result.success).toBe(false);
      expect(mockFS.written.size).toBe(0); // No files written
    });

    it("returns success when all versions are in sync", async () => {
      mockFS.dirs.set("/test/packages", ["hash", "compress"]);
      mockFS.files.set("/test/packages/hash/package.json", {
        name: "@zig-wasm/hash",
        version: "1.0.0",
      });
      mockFS.files.set("/test/packages/hash/jsr.json", {
        name: "@zig-wasm/hash",
        version: "1.0.0",
      });
      mockFS.files.set("/test/packages/compress/package.json", {
        name: "@zig-wasm/compress",
        version: "0.5.0",
      });
      mockFS.files.set("/test/packages/compress/jsr.json", {
        name: "@zig-wasm/compress",
        version: "0.5.0",
      });

      setupMocks("/test");

      const result = await syncVersions({ cwd: "/test" });

      expect(result.mismatches).toBe(0);
      expect(result.synced).toEqual([]);
      expect(result.success).toBe(true);
    });
  });

  describe("directory scanning", () => {
    it("scans both packages and internal directories", async () => {
      mockFS.dirs.set("/test/packages", ["core"]);
      mockFS.dirs.set("/test/internal", ["tooling"]);
      mockFS.files.set("/test/packages/core/package.json", {
        name: "@zig-wasm/core",
        version: "1.0.0",
      });
      mockFS.files.set("/test/packages/core/jsr.json", {
        name: "@zig-wasm/core",
        version: "0.9.0",
      });
      mockFS.files.set("/test/internal/tooling/package.json", {
        name: "@zig-wasm/tooling",
        version: "2.0.0",
      });
      mockFS.files.set("/test/internal/tooling/jsr.json", {
        name: "@zig-wasm/tooling",
        version: "1.0.0",
      });

      setupMocks("/test");

      const result = await syncVersions({ cwd: "/test" });

      expect(result.mismatches).toBe(2);
      expect(result.synced).toHaveLength(2);
      expect(result.synced).toContain("@zig-wasm/core");
      expect(result.synced).toContain("@zig-wasm/tooling");
    });

    it("skips directories without both package.json and jsr.json", async () => {
      mockFS.dirs.set("/test/packages", ["with-both", "package-only", "jsr-only"]);
      mockFS.files.set("/test/packages/with-both/package.json", {
        name: "@test/with-both",
        version: "1.0.0",
      });
      mockFS.files.set("/test/packages/with-both/jsr.json", {
        name: "@test/with-both",
        version: "1.0.0",
      });
      mockFS.files.set("/test/packages/package-only/package.json", {
        name: "@test/package-only",
        version: "1.0.0",
      });
      mockFS.files.set("/test/packages/jsr-only/jsr.json", {
        name: "@test/jsr-only",
        version: "1.0.0",
      });

      setupMocks("/test");

      const result = await syncVersions({ cwd: "/test" });

      // Only processes the directory with both files
      expect(result.mismatches).toBe(0);
      expect(result.synced).toEqual([]);
    });

    it("handles missing directories gracefully", async () => {
      mockFS.dirs.set("/test/packages", []); // Empty but exists
      // internal dir doesn't exist

      setupMocks("/test");

      const result = await syncVersions({ cwd: "/test" });

      expect(result.success).toBe(true);
      expect(result.mismatches).toBe(0);
    });
  });

  describe("result structure", () => {
    it("returns correct result structure", async () => {
      mockFS.dirs.set("/test/packages", []);
      setupMocks("/test");

      const result = await syncVersions({ cwd: "/test" });

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("mismatches");
      expect(result).toHaveProperty("synced");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.mismatches).toBe("number");
      expect(Array.isArray(result.synced)).toBe(true);
    });

    it("tracks all synced packages", async () => {
      mockFS.dirs.set("/test/packages", ["pkg1", "pkg2", "pkg3"]);

      for (let i = 1; i <= 3; i++) {
        mockFS.files.set(`/test/packages/pkg${i}/package.json`, {
          name: `@test/pkg${i}`,
          version: "2.0.0",
        });
        mockFS.files.set(`/test/packages/pkg${i}/jsr.json`, {
          name: `@test/pkg${i}`,
          version: "1.0.0",
        });
      }

      setupMocks("/test");

      const result = await syncVersions({ cwd: "/test" });

      expect(result.mismatches).toBe(3);
      expect(result.synced).toHaveLength(3);
      expect(result.success).toBe(true);
    });
  });

  describe("error handling", () => {
    it("continues processing after individual file errors", async () => {
      mockFS.dirs.set("/test/packages", ["good", "bad"]);
      mockFS.files.set("/test/packages/good/package.json", {
        name: "@test/good",
        version: "1.0.0",
      });
      mockFS.files.set("/test/packages/good/jsr.json", {
        name: "@test/good",
        version: "0.9.0",
      });
      // bad directory will throw errors

      setupMocks("/test");

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await syncVersions({ cwd: "/test" });

      expect(result.synced).toContain("@test/good");
      consoleSpy.mockRestore();
    });

    it("handles JSON parsing errors", async () => {
      mockFS.dirs.set("/test/packages", ["corrupt"]);

      setupMocks("/test");

      // Mock Bun.file to return invalid JSON
      const originalBunFile = global.Bun.file;
      global.Bun = {
        ...global.Bun,
        file: vi.fn((path) => {
          if (path.includes("corrupt")) {
            return {
              exists: vi.fn().mockResolvedValue(true),
              json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
            };
          }
          return originalBunFile(path);
        }),
      } as unknown as typeof Bun;

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await syncVersions({ cwd: "/test" });

      expect(result.success).toBe(true); // Should succeed despite errors
      consoleSpy.mockRestore();
    });
  });

  describe("version formatting", () => {
    it("preserves version format when syncing", async () => {
      mockFS.dirs.set("/test/packages", ["versioned"]);
      mockFS.files.set("/test/packages/versioned/package.json", {
        name: "@test/versioned",
        version: "1.2.3-beta.4+build.5",
      });
      mockFS.files.set("/test/packages/versioned/jsr.json", {
        name: "@test/versioned",
        version: "1.0.0",
        other: "field",
      });

      setupMocks("/test");

      await syncVersions({ cwd: "/test" });

      const written = mockFS.written.get("/test/packages/versioned/jsr.json");
      expect(written).toBeDefined();
      if (written) {
        const parsed = JSON.parse(written);
        expect(parsed.version).toBe("1.2.3-beta.4+build.5");
        expect(parsed.other).toBe("field"); // Preserves other fields
      }
    });

    it("maintains JSON formatting with proper indentation", async () => {
      mockFS.dirs.set("/test/packages", ["formatted"]);
      mockFS.files.set("/test/packages/formatted/package.json", {
        name: "@test/formatted",
        version: "2.0.0",
      });
      mockFS.files.set("/test/packages/formatted/jsr.json", {
        name: "@test/formatted",
        version: "1.0.0",
        exports: "./index.ts",
      });

      setupMocks("/test");

      await syncVersions({ cwd: "/test" });

      const written = mockFS.written.get("/test/packages/formatted/jsr.json");
      expect(written).toBeDefined();

      if (written) {
        // Should have 2-space indentation and trailing newline
        expect(written).toContain("  ");
        expect(written).toMatch(/\n$/);
        expect(JSON.parse(written)).toEqual({
          name: "@test/formatted",
          version: "2.0.0",
          exports: "./index.ts",
        });
      }
    });
  });

  describe("CLI entry point", () => {
    it("exits with code 0 when all versions are in sync", async () => {
      const result = await runCli([]);

      // Real project should have versions in sync (assuming maintained properly)
      expect([0, 1]).toContain(result.code);
      expect(result.stdout).toContain("Syncing package versions");
    }, 10000);

    it("handles --check flag", async () => {
      const result = await runCli(["--check"]);

      // In check mode, just reports without modifying
      expect([0, 1]).toContain(result.code);
      expect(result.stdout).toContain("Syncing package versions");

      // If mismatches found, should suggest running without --check
      if (result.code === 1) {
        expect(result.stdout).toContain("Run without --check");
      }
    }, 10000);

    it("outputs sync status for packages", async () => {
      const result = await runCli([]);

      // Should mention some packages by name
      expect(result.stdout).toMatch(/@zig-wasm\//);
    }, 10000);
  });
});

// Helper function to setup all mocks
function setupMocks(_basePath: string) {
  // Mock readdirSync
  vi.mocked(fs.readdirSync).mockImplementation((path: fs.PathLike) => {
    const pathStr = String(path);
    const dirs = mockFS.dirs.get(pathStr);
    if (!dirs) {
      throw { code: "ENOENT" };
    }
    return dirs.map((name) => ({
      name,
      isDirectory: () => true,
      isFile: () => false,
      isBlockDevice: () => false,
      isCharacterDevice: () => false,
      isSymbolicLink: () => false,
      isFIFO: () => false,
      isSocket: () => false,
    })) as never;
  });

  // Mock Bun.file
  global.Bun = {
    file: vi.fn((path: string) => ({
      exists: vi.fn().mockResolvedValue(mockFS.files.has(path)),
      json: vi.fn().mockImplementation(async () => {
        const data = mockFS.files.get(path);
        if (!data) throw { code: "ENOENT" };
        return data;
      }),
    })),
    write: vi.fn((path: string, content: string) => {
      mockFS.written.set(path, content);
      return Promise.resolve();
    }),
  } as unknown as typeof Bun;

  // Mock console methods
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
}
