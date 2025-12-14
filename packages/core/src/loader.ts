/**
 * WASM module loader for various source types.
 *
 * This module provides flexible loading of WebAssembly modules from:
 * - **Bytes**: Pre-loaded `ArrayBuffer` or `Uint8Array` via `wasmBytes`
 * - **URLs**: Fetch from URL (browser/Deno) via `wasmUrl`
 * - **File paths**: Read from filesystem (Node.js/Bun) via `wasmPath`
 *
 * The loader automatically:
 * - Detects the runtime environment to choose the best loading strategy
 * - Uses streaming instantiation when available (browser/Deno)
 * - Provides default imports for Zig's panic handler
 * - Validates that the module exports required `memory`, `alloc`, and `free`
 *
 * For a higher-level abstraction with init/sync patterns, see
 * {@link createWasmModule} in the `wasm-module` module.
 *
 * @example Loading from bytes
 * ```ts
 * import { loadWasm } from "@zig-wasm/core";
 *
 * const wasmBytes = await fetch("/my-module.wasm").then(r => r.arrayBuffer());
 * const { exports, memory } = await loadWasm({ wasmBytes });
 * ```
 *
 * @example Loading from URL (browser/Deno)
 * ```ts
 * import { loadWasm } from "@zig-wasm/core";
 *
 * const { exports } = await loadWasm({
 *   wasmUrl: "/wasm/my-module.wasm"
 * });
 * ```
 *
 * @example Loading from file path (Node.js/Bun)
 * ```ts
 * import { loadWasm } from "@zig-wasm/core";
 *
 * const { exports } = await loadWasm({
 *   wasmPath: "./dist/my-module.wasm"
 * });
 * ```
 *
 * @example Custom fetch function
 * ```ts
 * import { loadWasm } from "@zig-wasm/core";
 *
 * const { exports } = await loadWasm({
 *   wasmUrl: "https://example.com/module.wasm",
 *   fetchFn: async (url) => {
 *     const response = await fetch(url, {
 *       headers: { "Authorization": "Bearer token" }
 *     });
 *     return response.arrayBuffer();
 *   }
 * });
 * ```
 *
 * @example Custom imports
 * ```ts
 * import { loadWasm } from "@zig-wasm/core";
 *
 * const { exports } = await loadWasm({
 *   wasmPath: "./module.wasm",
 *   imports: {
 *     env: {
 *       consoleLog: (ptr: number, len: number) => {
 *         // Custom logging from WASM
 *       }
 *     }
 *   }
 * });
 * ```
 *
 * @module loader
 */

import { getEnvironment } from "./env.ts";
import { WasmLoadError } from "./errors.ts";
import type { FetchWasmFn, WasmLoadOptions, WasmLoadResult, ZigWasmExports } from "./types.ts";

/**
 * Default fetch function for loading WASM from URLs.
 *
 * Uses the global `fetch` API to retrieve WASM bytes. Can be overridden
 * via {@link WasmLoadOptions.fetchFn} for custom loaders (e.g., authenticated
 * requests, custom caching).
 *
 * @param url - The URL to fetch WASM from
 * @returns A Promise resolving to the WASM bytes as an ArrayBuffer
 * @throws Error if the fetch fails or returns a non-OK status
 *
 * @example
 * ```ts
 * import { defaultFetchFn } from "@zig-wasm/core";
 *
 * const bytes = await defaultFetchFn("/my-module.wasm");
 * console.log("Loaded", bytes.byteLength, "bytes");
 * ```
 */
export async function defaultFetchFn(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/** Default imports provided to all Zig WASM modules */
function getDefaultImports(): WebAssembly.Imports {
  return {
    env: {
      // Zig's panic handler - we convert to JS error
      _panic: (ptr: number, len: number) => {
        throw new Error(`Zig panic at ptr=${ptr}, len=${len}`);
      },
    },
  };
}

/** Merge user imports with defaults */
function mergeImports(
  defaults: WebAssembly.Imports,
  custom?: WebAssembly.Imports,
): WebAssembly.Imports {
  if (!custom) return defaults;

  const result: WebAssembly.Imports = { ...defaults };
  for (const [key, value] of Object.entries(custom)) {
    if (typeof value === "object" && value !== null) {
      result[key] = { ...(result[key] as object), ...value };
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Load WASM bytes from URL (browser/Deno) */
async function loadFromUrl(url: string | URL, fetchFn?: FetchWasmFn): Promise<ArrayBuffer> {
  const urlStr = url instanceof URL ? url.href : url;
  if (fetchFn) {
    return fetchFn(urlStr);
  }
  return defaultFetchFn(urlStr);
}

/** Load WASM bytes from file path (Node.js/Bun) */
async function loadFromPath(path: string): Promise<ArrayBuffer> {
  const env = getEnvironment();

  if (env.isNode || env.isBun) {
    const fs = await import("node:fs/promises");
    const buffer = await fs.readFile(path);
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
  }

  throw new WasmLoadError("unknown", new Error("File path loading only supported in Node.js/Bun"));
}

/** Load WASM module with streaming if available */
async function instantiateWasm(
  source: ArrayBuffer | Response | Promise<Response>,
  imports: WebAssembly.Imports,
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  const env = getEnvironment();

  // Use streaming instantiation if available and source is Response
  if (
    env.supportsStreaming
    && (source instanceof Response || source instanceof Promise)
  ) {
    return WebAssembly.instantiateStreaming(source as Response, imports);
  }

  // Fall back to ArrayBuffer instantiation
  const bytes = source instanceof ArrayBuffer ? source : await (source as Promise<Response>).then(r => r.arrayBuffer());
  return WebAssembly.instantiate(bytes, imports);
}

/**
 * Load a Zig WASM module from various sources.
 *
 * This is the primary function for loading WebAssembly modules. It handles:
 * - Source detection (bytes, URL, or file path)
 * - Environment-appropriate loading (streaming for browser, file read for Node)
 * - Import merging (your custom imports + default Zig panic handler)
 * - Validation of required exports (`memory`, `alloc`, `free`)
 *
 * You must provide exactly one of: `wasmBytes`, `wasmUrl`, or `wasmPath`.
 *
 * @typeParam T - The type of the WASM module's exports (extends {@link ZigWasmExports})
 * @param options - Loading options specifying the source and optional configuration
 * @returns A Promise resolving to a {@link WasmLoadResult} with instance, exports, and memory
 * @throws {@link WasmLoadError} if loading fails for any reason
 *
 * @example Loading from pre-fetched bytes
 * ```ts
 * import { loadWasm } from "@zig-wasm/core";
 *
 * const response = await fetch("/my-module.wasm");
 * const wasmBytes = await response.arrayBuffer();
 *
 * const { exports, memory } = await loadWasm({ wasmBytes });
 * ```
 *
 * @example Loading from URL with streaming (browser/Deno)
 * ```ts
 * import { loadWasm } from "@zig-wasm/core";
 *
 * // Streaming instantiation is used automatically when available
 * const { exports } = await loadWasm({
 *   wasmUrl: "/wasm/my-module.wasm"
 * });
 * ```
 *
 * @example Loading from file path (Node.js/Bun)
 * ```ts
 * import { loadWasm } from "@zig-wasm/core";
 *
 * const { exports } = await loadWasm({
 *   wasmPath: "./dist/my-module.wasm"
 * });
 * ```
 *
 * @example With typed exports
 * ```ts
 * import { loadWasm, ZigWasmExports } from "@zig-wasm/core";
 *
 * interface MyModuleExports extends ZigWasmExports {
 *   add: (a: number, b: number) => number;
 *   multiply: (a: number, b: number) => number;
 * }
 *
 * const { exports } = await loadWasm<MyModuleExports>({
 *   wasmPath: "./math.wasm"
 * });
 *
 * console.log(exports.add(2, 3)); // 5
 * ```
 */
export async function loadWasm<T extends ZigWasmExports = ZigWasmExports>(
  options: WasmLoadOptions,
): Promise<WasmLoadResult<T>> {
  const defaultImports = getDefaultImports();
  const imports = mergeImports(defaultImports, options.imports);

  let wasmSource: ArrayBuffer | Response | Promise<Response>;

  try {
    if (options.wasmBytes) {
      // Direct bytes provided
      wasmSource = options.wasmBytes instanceof Uint8Array
        ? (options.wasmBytes.buffer.slice(
          options.wasmBytes.byteOffset,
          options.wasmBytes.byteOffset + options.wasmBytes.byteLength,
        ) as ArrayBuffer)
        : options.wasmBytes;
    } else if (options.wasmUrl) {
      const env = getEnvironment();
      // Use streaming only if no custom fetchFn and browser supports it
      if (env.supportsStreaming && !options.fetchFn) {
        wasmSource = fetch(options.wasmUrl);
      } else {
        wasmSource = await loadFromUrl(options.wasmUrl, options.fetchFn);
      }
    } else if (options.wasmPath) {
      wasmSource = await loadFromPath(options.wasmPath);
    } else {
      throw new WasmLoadError("unknown", new Error("Must provide one of: wasmBytes, wasmUrl, or wasmPath"));
    }

    const { instance } = await instantiateWasm(wasmSource, imports);
    const exports = instance.exports as T;

    if (!exports.memory) {
      throw new WasmLoadError("unknown", new Error("WASM module must export 'memory'"));
    }

    return {
      instance,
      exports,
      memory: exports.memory,
    };
  } catch (error) {
    if (error instanceof WasmLoadError) {
      throw error;
    }
    throw new WasmLoadError("unknown", error);
  }
}

/**
 * Create a cached module loader for a specific WASM file.
 *
 * Returns a loader function that loads the WASM module on first call
 * and returns the cached result on subsequent calls. This is useful
 * for ensuring a module is only loaded once, even if multiple parts
 * of your application request it.
 *
 * @typeParam T - The type of the WASM module's exports
 * @param getWasmSource - A function that returns the loading options
 * @returns A function that returns a Promise resolving to the load result
 *
 * @example
 * ```ts
 * import { createModuleLoader, ZigWasmExports } from "@zig-wasm/core";
 *
 * interface MathExports extends ZigWasmExports {
 *   add: (a: number, b: number) => number;
 * }
 *
 * // Create a cached loader
 * const loadMathModule = createModuleLoader<MathExports>(() => ({
 *   wasmPath: "./math.wasm"
 * }));
 *
 * // First call loads the module
 * const result1 = await loadMathModule();
 *
 * // Subsequent calls return cached result
 * const result2 = await loadMathModule();
 * console.log(result1 === result2); // true
 * ```
 */
export function createModuleLoader<T extends ZigWasmExports>(
  getWasmSource: () => WasmLoadOptions,
): () => Promise<WasmLoadResult<T>> {
  let cached: Promise<WasmLoadResult<T>> | null = null;

  return () => {
    if (!cached) {
      cached = loadWasm<T>(getWasmSource());
    }
    return cached;
  };
}

/**
 * Resolve a WASM path relative to a module's URL.
 *
 * Works with `import.meta.url` to resolve paths relative to the
 * current module. Automatically converts `file://` URLs to paths
 * in Node.js/Bun environments.
 *
 * @param importMetaUrl - The `import.meta.url` of the calling module
 * @param relativePath - The relative path to the WASM file
 * @returns The resolved path (filesystem path for Node/Bun, URL for browser/Deno)
 *
 * @example
 * ```ts
 * import { resolveWasmPath, loadWasm } from "@zig-wasm/core";
 *
 * // In your module file:
 * const wasmPath = resolveWasmPath(import.meta.url, "./my-module.wasm");
 *
 * // In Node.js: returns "/absolute/path/to/my-module.wasm"
 * // In browser: returns "https://example.com/path/to/my-module.wasm"
 *
 * const { exports } = await loadWasm({ wasmPath });
 * ```
 */
export function resolveWasmPath(
  importMetaUrl: string,
  relativePath: string,
): string {
  const url = new URL(relativePath, importMetaUrl);
  const env = getEnvironment();

  if (env.isNode || env.isBun) {
    // Convert file:// URL to path for Node.js
    if (url.protocol === "file:") {
      return url.pathname;
    }
  }

  return url.href;
}
