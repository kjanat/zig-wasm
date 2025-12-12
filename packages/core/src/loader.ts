/**
 * WASM module loader - handles loading from various sources
 */

import { getEnvironment } from "./env.js";
import type { WasmLoadOptions, WasmLoadResult, ZigWasmExports } from "./types.js";

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
      result[key] = { ...(result[key] as object || {}), ...value };
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Load WASM bytes from URL (browser/Deno) */
async function loadFromUrl(url: string | URL): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/** Load WASM bytes from file path (Node.js) */
async function loadFromPath(path: string): Promise<ArrayBuffer> {
  const env = getEnvironment();

  if (env.isNode || env.isBun) {
    // Dynamic import for Node.js fs
    const fs = await import("node:fs/promises");
    const buffer = await fs.readFile(path);
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
  }

  throw new Error("File path loading only supported in Node.js/Bun");
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
 * Load a Zig WASM module
 *
 * @param options - Loading options (bytes, url, or path)
 * @returns Promise resolving to instance, exports, and memory
 *
 * @example
 * ```ts
 * // From bytes
 * const result = await loadWasm({ wasmBytes: myBytes });
 *
 * // From URL (browser)
 * const result = await loadWasm({ wasmUrl: '/my-module.wasm' });
 *
 * // From path (Node.js)
 * const result = await loadWasm({ wasmPath: './my-module.wasm' });
 * ```
 */
export async function loadWasm<T extends ZigWasmExports = ZigWasmExports>(
  options: WasmLoadOptions,
): Promise<WasmLoadResult<T>> {
  const defaultImports = getDefaultImports();
  const imports = mergeImports(defaultImports, options.imports);

  let wasmSource: ArrayBuffer | Response | Promise<Response>;

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
    if (env.supportsStreaming) {
      // Use streaming for browsers
      wasmSource = fetch(options.wasmUrl);
    } else {
      wasmSource = await loadFromUrl(options.wasmUrl);
    }
  } else if (options.wasmPath) {
    wasmSource = await loadFromPath(options.wasmPath);
  } else {
    throw new Error(
      "Must provide one of: wasmBytes, wasmUrl, or wasmPath",
    );
  }

  const { instance } = await instantiateWasm(wasmSource, imports);
  const exports = instance.exports as T;

  if (!exports.memory) {
    throw new Error("WASM module must export 'memory'");
  }

  return {
    instance,
    exports,
    memory: exports.memory,
  };
}

/**
 * Create a module loader for a specific WASM file
 * Returns a cached loader that only loads once
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
 * Helper to get WASM path relative to a module
 * Works with import.meta.url
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
