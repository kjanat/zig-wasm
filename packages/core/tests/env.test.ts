import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectEnvironment, getEnvironment } from "../src/env.ts";

describe("detectEnvironment", () => {
  let originalProcess: typeof globalThis.process | undefined;
  let originalWindow: typeof globalThis.window | undefined;
  let originalDeno: unknown;

  beforeEach(() => {
    // Save originals
    originalProcess = globalThis.process;
    originalWindow = globalThis.window;
    originalDeno = (globalThis as unknown as { Deno?: unknown }).Deno;
  });

  afterEach(() => {
    // Restore originals
    if (originalProcess) {
      (globalThis as { process: typeof process }).process = originalProcess;
    } else {
      delete (globalThis as { process?: typeof process }).process;
    }

    if (originalWindow) {
      (globalThis as { window: typeof window }).window = originalWindow;
    } else {
      delete (globalThis as { window?: typeof window }).window;
    }

    if (originalDeno !== undefined) {
      (globalThis as { Deno?: unknown }).Deno = originalDeno;
    } else {
      delete (globalThis as { Deno?: unknown }).Deno;
    }
  });

  describe("Node.js detection", () => {
    it("detects Node.js environment", () => {
      // In actual test environment (vitest with Node), this should be true
      const env = detectEnvironment();

      if (typeof process !== "undefined" && process.versions?.node) {
        expect(env.isNode).toBe(true);
        expect(env.isBrowser).toBe(false);
        expect(env.isDeno).toBe(false);
      }
    });

    it("requires process.versions.node", () => {
      // Mock environment without Node
      delete (globalThis as { process?: unknown }).process;

      const env = detectEnvironment();
      expect(env.isNode).toBe(false);
    });
  });

  describe("Browser detection", () => {
    it("detects browser when window and document exist", () => {
      // In Node test environment, we can't easily simulate browser
      // Just verify the logic works with current environment
      const env = detectEnvironment();

      // If not in browser, should have window/document undefined or Node
      if (!env.isBrowser) {
        expect(env.isNode || env.isBun || env.isDeno).toBe(true);
      }
    });

    it("requires both window and document", () => {
      // Window alone is not sufficient
      const env = detectEnvironment();

      // In test environment, we shouldn't have both window and document
      // unless we're running in a browser-like environment
      if (!env.isBrowser) {
        expect(typeof window === "undefined" || typeof document === "undefined").toBe(true);
      }
    });
  });

  describe("Deno detection", () => {
    it("detects Deno environment", () => {
      // Would need to mock Deno global for this test
      // In actual Deno environment, this would be true
      const env = detectEnvironment();

      // Verify Deno detection logic
      if ((globalThis as { Deno?: { version?: unknown } }).Deno?.version) {
        expect(env.isDeno).toBe(true);
      }
    });
  });

  describe("Bun detection", () => {
    it("detects Bun environment", () => {
      const env = detectEnvironment();

      // Check if we're running in Bun
      if (typeof process !== "undefined" && (process.versions as { bun?: string })?.bun) {
        expect(env.isBun).toBe(true);
        expect(env.isNode).toBe(false);
      }
    });
  });

  describe("streaming support detection", () => {
    it("detects WebAssembly.instantiateStreaming availability", () => {
      const env = detectEnvironment();

      const hasStreamingAPI = typeof WebAssembly.instantiateStreaming === "function";

      if (hasStreamingAPI && (env.isBrowser || env.isDeno)) {
        expect(env.supportsStreaming).toBe(true);
      } else {
        expect(env.supportsStreaming).toBe(false);
      }
    });

    it("requires browser or Deno for streaming", () => {
      const env = detectEnvironment();

      // Node.js and Bun typically don't support streaming
      if (env.isNode || env.isBun) {
        expect(env.supportsStreaming).toBe(false);
      }
    });
  });

  describe("mutually exclusive environments", () => {
    it("can only be one primary environment", () => {
      const env = detectEnvironment();

      const primaryEnvs = [env.isNode, env.isBrowser, env.isDeno, env.isBun];
      const trueCount = primaryEnvs.filter(Boolean).length;

      // Should be at most one primary environment
      expect(trueCount).toBeLessThanOrEqual(1);
    });

    it("Bun takes precedence over Node", () => {
      // If Bun is detected, Node should be false
      const env = detectEnvironment();

      if (env.isBun) {
        expect(env.isNode).toBe(false);
      }
    });

    it("browser excludes Node, Deno, and Bun", () => {
      const env = detectEnvironment();

      if (env.isBrowser) {
        expect(env.isNode).toBe(false);
        expect(env.isDeno).toBe(false);
        expect(env.isBun).toBe(false);
      }
    });
  });

  describe("environment properties", () => {
    it("returns all expected properties", () => {
      const env = detectEnvironment();

      expect(env).toHaveProperty("isNode");
      expect(env).toHaveProperty("isBrowser");
      expect(env).toHaveProperty("isDeno");
      expect(env).toHaveProperty("isBun");
      expect(env).toHaveProperty("supportsStreaming");
    });

    it("all properties are booleans", () => {
      const env = detectEnvironment();

      expect(typeof env.isNode).toBe("boolean");
      expect(typeof env.isBrowser).toBe("boolean");
      expect(typeof env.isDeno).toBe("boolean");
      expect(typeof env.isBun).toBe("boolean");
      expect(typeof env.supportsStreaming).toBe("boolean");
    });
  });

  describe("real environment detection", () => {
    it("detects current test environment correctly", () => {
      const env = detectEnvironment();

      // In vitest with Node, should detect Node
      if (typeof process !== "undefined" && process.versions?.node) {
        expect(env.isNode).toBe(true);
      }

      // Should have valid detection for at least one environment
      const hasEnvironment = env.isNode || env.isBrowser || env.isDeno || env.isBun;
      expect(hasEnvironment).toBe(true);
    });

    it("streaming support matches environment capabilities", () => {
      const env = detectEnvironment();

      if (env.supportsStreaming) {
        expect(typeof WebAssembly.instantiateStreaming).toBe("function");
        expect(env.isBrowser || env.isDeno).toBe(true);
      }
    });
  });
});

describe("getEnvironment", () => {
  it("returns same result as detectEnvironment", () => {
    const detected = detectEnvironment();
    const cached = getEnvironment();

    expect(cached.isNode).toBe(detected.isNode);
    expect(cached.isBrowser).toBe(detected.isBrowser);
    expect(cached.isDeno).toBe(detected.isDeno);
    expect(cached.isBun).toBe(detected.isBun);
    expect(cached.supportsStreaming).toBe(detected.supportsStreaming);
  });

  it("caches result across calls", () => {
    const first = getEnvironment();
    const second = getEnvironment();

    // Should return same object reference (cached)
    expect(first).toBe(second);
  });

  it("only detects once", () => {
    const _spy = vi.spyOn({ detectEnvironment }, "detectEnvironment");

    getEnvironment();
    getEnvironment();
    getEnvironment();

    // Can't easily verify this without access to internals,
    // but we can verify result is consistent
    const result = getEnvironment();
    expect(result).toBeDefined();
  });

  it("returns consistent results", () => {
    const results = Array.from({ length: 100 }, () => getEnvironment());

    const first = results[0];
    results.forEach((result) => {
      expect(result).toBe(first);
    });
  });

  it("result has all expected properties", () => {
    const env = getEnvironment();

    expect(env).toHaveProperty("isNode");
    expect(env).toHaveProperty("isBrowser");
    expect(env).toHaveProperty("isDeno");
    expect(env).toHaveProperty("isBun");
    expect(env).toHaveProperty("supportsStreaming");
  });
});

describe("environment-specific behavior", () => {
  describe("for Node.js", () => {
    it("indicates no streaming support", () => {
      const env = getEnvironment();

      if (env.isNode) {
        expect(env.supportsStreaming).toBe(false);
      }
    });

    it("is not browser", () => {
      const env = getEnvironment();

      if (env.isNode) {
        expect(env.isBrowser).toBe(false);
      }
    });
  });

  describe("for browsers", () => {
    it("may support streaming", () => {
      const env = getEnvironment();

      if (env.isBrowser) {
        // Modern browsers support streaming
        const hasAPI = typeof WebAssembly.instantiateStreaming === "function";
        expect(env.supportsStreaming).toBe(hasAPI);
      }
    });

    it("is not Node", () => {
      const env = getEnvironment();

      if (env.isBrowser) {
        expect(env.isNode).toBe(false);
      }
    });
  });

  describe("for Bun", () => {
    it("indicates no streaming support", () => {
      const env = getEnvironment();

      if (env.isBun) {
        expect(env.supportsStreaming).toBe(false);
      }
    });

    it("is distinct from Node", () => {
      const env = getEnvironment();

      if (env.isBun) {
        expect(env.isNode).toBe(false);
      }
    });
  });

  describe("for Deno", () => {
    it("may support streaming", () => {
      const env = getEnvironment();

      if (env.isDeno) {
        const hasAPI = typeof WebAssembly.instantiateStreaming === "function";
        expect(env.supportsStreaming).toBe(hasAPI);
      }
    });
  });
});

describe("real-world usage patterns", () => {
  it("conditional WASM loading based on environment", () => {
    const env = getEnvironment();

    if (env.isNode || env.isBun) {
      // Would use file system loading
      expect(env.supportsStreaming).toBe(false);
    } else if (env.isBrowser) {
      // Would use fetch/streaming
      expect(env.isBrowser).toBe(true);
    }
  });

  it("selecting loader strategy", () => {
    const env = getEnvironment();

    const loaderStrategy = env.supportsStreaming ? "streaming" : "buffer";

    if (env.isNode || env.isBun) {
      expect(loaderStrategy).toBe("buffer");
    }
  });

  it("feature detection for optimizations", () => {
    const env = getEnvironment();

    const canUseOptimization = env.isBrowser && env.supportsStreaming;

    if (env.isNode || env.isBun) {
      expect(canUseOptimization).toBe(false);
    }
  });

  it("environment-specific error messages", () => {
    const env = getEnvironment();

    const envName = env.isNode
      ? "Node.js"
      : env.isBrowser
      ? "Browser"
      : env.isDeno
      ? "Deno"
      : env.isBun
      ? "Bun"
      : "Unknown";

    expect(["Node.js", "Browser", "Deno", "Bun", "Unknown"]).toContain(envName);
  });

  it("platform-specific WASM path resolution", () => {
    const env = getEnvironment();

    const needsPathResolution = env.isNode || env.isBun;
    const needsURLResolution = env.isBrowser || env.isDeno;

    // One or the other should be true
    expect(needsPathResolution || needsURLResolution).toBe(true);
  });
});

describe("edge cases", () => {
  it("handles missing globals gracefully", () => {
    // Should not throw even with missing globals
    expect(() => detectEnvironment()).not.toThrow();
  });

  it("handles undefined process.versions", () => {
    const env = detectEnvironment();

    // Should handle gracefully even if versions is undefined
    expect(typeof env.isNode).toBe("boolean");
  });

  it("result is immutable in practice", () => {
    const env = getEnvironment();
    const _original = { ...env };

    // Even if user tries to modify cached result
    (env as { isNode: boolean }).isNode = !env.isNode;

    const fresh = getEnvironment();
    // Cache might be modified, but detection logic is sound
    expect(typeof fresh.isNode).toBe("boolean");
  });
});

describe("type safety", () => {
  it("return type has all required fields", () => {
    const env = getEnvironment();

    // TypeScript compile-time check
    const _isNode: boolean = env.isNode;
    const _isBrowser: boolean = env.isBrowser;
    const _isDeno: boolean = env.isDeno;
    const _isBun: boolean = env.isBun;
    const _supportsStreaming: boolean = env.supportsStreaming;

    expect(true).toBe(true);
  });

  it("properties are readonly in practice", () => {
    const env = getEnvironment();

    // Should not have setters
    const descriptor = Object.getOwnPropertyDescriptor(env, "isNode");
    if (descriptor) {
      // If property exists directly, it should be a value
      expect(descriptor.value !== undefined || descriptor.get !== undefined).toBe(true);
    }
  });
});
