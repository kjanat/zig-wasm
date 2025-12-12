import type { WasmLoadResult } from "@zig-wasm/core";
import { AllocationScope, getEnvironment, loadWasm, WasmMemory } from "@zig-wasm/core";

import type { Base64WasmExports } from "./types.ts";

// Lazy-loaded module
let wasmModule: Promise<WasmLoadResult<Base64WasmExports>> | null = null;
let memory: WasmMemory | null = null;

/** Get or load the WASM module */
async function getModule(): Promise<{
  exports: Base64WasmExports;
  memory: WasmMemory;
}> {
  if (!wasmModule) {
    const env = getEnvironment();

    if (env.isNode || env.isBun) {
      // Node.js: load from file
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "base64.wasm");
      wasmModule = loadWasm<Base64WasmExports>({ wasmPath });
    } else {
      // Browser: load from URL relative to module
      const wasmUrl = new URL("base64.wasm", import.meta.url);
      wasmModule = loadWasm<Base64WasmExports>({ wasmUrl: wasmUrl.href });
    }
  }

  const result = await wasmModule;
  if (!memory) {
    memory = new WasmMemory(result.exports);
  }
  return { exports: result.exports, memory };
}

/** Convert input to Uint8Array */
function toBytes(data: string | Uint8Array): Uint8Array {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data;
}

// ============================================================================
// Standard Base64
// ============================================================================

/** Encode data to standard Base64 */
export async function encode(data: string | Uint8Array): Promise<string> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(data);

  const encodedLen = exports.base64_encode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(encodedLen);

    const actualLen = exports.base64_encode(input.ptr, input.len, outputPtr);
    const encoded = mem.copyOut(outputPtr, actualLen);
    return new TextDecoder().decode(encoded);
  });
}

/** Decode standard Base64 to bytes */
export async function decode(str: string): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(str);

  const decodedLen = exports.base64_decode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(decodedLen);

    const actualLen = exports.base64_decode(input.ptr, input.len, outputPtr);
    return mem.copyOut(outputPtr, actualLen);
  });
}

// ============================================================================
// Base64 No Padding
// ============================================================================

/** Encode data to Base64 without padding */
export async function encodeNoPadding(
  data: string | Uint8Array,
): Promise<string> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(data);

  const encodedLen = exports.base64_no_pad_encode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(encodedLen);

    const actualLen = exports.base64_no_pad_encode(
      input.ptr,
      input.len,
      outputPtr,
    );
    const encoded = mem.copyOut(outputPtr, actualLen);
    return new TextDecoder().decode(encoded);
  });
}

/** Decode Base64 without padding to bytes */
export async function decodeNoPadding(str: string): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(str);

  const decodedLen = exports.base64_no_pad_decode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(decodedLen);

    const actualLen = exports.base64_no_pad_decode(
      input.ptr,
      input.len,
      outputPtr,
    );
    return mem.copyOut(outputPtr, actualLen);
  });
}

// ============================================================================
// Base64 URL-safe
// ============================================================================

/** Encode data to URL-safe Base64 */
export async function encodeUrl(data: string | Uint8Array): Promise<string> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(data);

  const encodedLen = exports.base64_url_encode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(encodedLen);

    const actualLen = exports.base64_url_encode(input.ptr, input.len, outputPtr);
    const encoded = mem.copyOut(outputPtr, actualLen);
    return new TextDecoder().decode(encoded);
  });
}

/** Decode URL-safe Base64 to bytes */
export async function decodeUrl(str: string): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(str);

  const decodedLen = exports.base64_url_decode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(decodedLen);

    const actualLen = exports.base64_url_decode(input.ptr, input.len, outputPtr);
    return mem.copyOut(outputPtr, actualLen);
  });
}

// ============================================================================
// Base64 URL-safe No Padding
// ============================================================================

/** Encode data to URL-safe Base64 without padding */
export async function encodeUrlNoPadding(
  data: string | Uint8Array,
): Promise<string> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(data);

  const encodedLen = exports.base64_url_no_pad_encode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(encodedLen);

    const actualLen = exports.base64_url_no_pad_encode(
      input.ptr,
      input.len,
      outputPtr,
    );
    const encoded = mem.copyOut(outputPtr, actualLen);
    return new TextDecoder().decode(encoded);
  });
}

/** Decode URL-safe Base64 without padding to bytes */
export async function decodeUrlNoPadding(str: string): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(str);

  const decodedLen = exports.base64_url_no_pad_decode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(decodedLen);

    const actualLen = exports.base64_url_no_pad_decode(
      input.ptr,
      input.len,
      outputPtr,
    );
    return mem.copyOut(outputPtr, actualLen);
  });
}

// ============================================================================
// Hex Encoding
// ============================================================================

/** Encode data to hexadecimal string */
export async function hexEncode(data: string | Uint8Array): Promise<string> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(data);

  const encodedLen = exports.hex_encode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(encodedLen);

    const actualLen = exports.hex_encode(input.ptr, input.len, outputPtr);
    const encoded = mem.copyOut(outputPtr, actualLen);
    return new TextDecoder().decode(encoded);
  });
}

/** Decode hexadecimal string to bytes */
export async function hexDecode(str: string): Promise<Uint8Array> {
  const { exports, memory: mem } = await getModule();
  const bytes = toBytes(str);

  const decodedLen = exports.hex_decode_len(bytes.length);

  return AllocationScope.use(mem, (scope) => {
    const input = scope.allocAndCopy(bytes);
    const outputPtr = scope.alloc(decodedLen);

    const actualLen = exports.hex_decode(input.ptr, input.len, outputPtr);
    return mem.copyOut(outputPtr, actualLen);
  });
}
