/**
 * Base64 module - base64 and hex encoding/decoding
 *
 * Provides both async (lazy-loading) and sync (requires init) APIs.
 */

import type { AllocationScope as AllocationScopeType, InitOptions } from "@zig-wasm/core";
import { AllocationScope, getEnvironment, loadWasm, NotInitializedError, WasmMemory } from "@zig-wasm/core";
import type { Base64WasmExports } from "./types.ts";

// ============================================================================
// Module initialization
// ============================================================================

let wasmExports: Base64WasmExports | null = null;
let wasmMemory: WasmMemory | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the base64 module (idempotent, concurrency-safe)
 */
export async function init(options?: InitOptions): Promise<void> {
  if (wasmExports) return;

  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    const env = getEnvironment();
    let result: Awaited<ReturnType<typeof loadWasm<Base64WasmExports>>>;

    if (options?.wasmBytes) {
      result = await loadWasm<Base64WasmExports>({ wasmBytes: options.wasmBytes, imports: options.imports });
    } else if (options?.wasmPath) {
      result = await loadWasm<Base64WasmExports>({ wasmPath: options.wasmPath, imports: options.imports });
    } else if (options?.wasmUrl) {
      result = await loadWasm<Base64WasmExports>({ wasmUrl: options.wasmUrl, imports: options.imports });
    } else if (env.isNode || env.isBun) {
      const { fileURLToPath } = await import("node:url");
      const { dirname, join } = await import("node:path");
      const currentDir = dirname(fileURLToPath(import.meta.url));
      const wasmPath = join(currentDir, "../wasm/base64.wasm");
      result = await loadWasm<Base64WasmExports>({ wasmPath });
    } else {
      const wasmUrl = new URL("../wasm/base64.wasm", import.meta.url);
      result = await loadWasm<Base64WasmExports>({ wasmUrl: wasmUrl.href });
    }

    wasmExports = result.exports;
    wasmMemory = new WasmMemory(result.exports);
  })();

  await initPromise;
}

/**
 * Check if the module is initialized
 */
export function isInitialized(): boolean {
  return wasmExports !== null;
}

async function ensureInit(): Promise<{ exports: Base64WasmExports; memory: WasmMemory }> {
  await init();
  return { exports: wasmExports as Base64WasmExports, memory: wasmMemory as WasmMemory };
}

function getSyncState(): { exports: Base64WasmExports; memory: WasmMemory } {
  if (!wasmExports || !wasmMemory) {
    throw new NotInitializedError("base64");
  }
  return { exports: wasmExports, memory: wasmMemory };
}

// ============================================================================
// Utilities
// ============================================================================

function toBytes(data: string | Uint8Array): Uint8Array {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data;
}

const textDecoder = new TextDecoder();

// ============================================================================
// Internal implementations
// ============================================================================

function encodeImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): string {
  const encodedLen = exports.base64_encode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(encodedLen);
    const actualLen = exports.base64_encode(input.ptr, input.len, outputPtr);
    return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
  });
}

function decodeImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): Uint8Array {
  const decodedLen = exports.base64_decode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(decodedLen);
    const actualLen = exports.base64_decode(input.ptr, input.len, outputPtr, decodedLen);
    return mem.copyOut(outputPtr, actualLen);
  });
}

function encodeNoPaddingImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): string {
  const encodedLen = exports.base64_no_pad_encode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(encodedLen);
    const actualLen = exports.base64_no_pad_encode(input.ptr, input.len, outputPtr);
    return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
  });
}

function decodeNoPaddingImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): Uint8Array {
  const decodedLen = exports.base64_no_pad_decode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(decodedLen);
    const actualLen = exports.base64_no_pad_decode(input.ptr, input.len, outputPtr, decodedLen);
    return mem.copyOut(outputPtr, actualLen);
  });
}

function encodeUrlImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): string {
  const encodedLen = exports.base64_url_encode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(encodedLen);
    const actualLen = exports.base64_url_encode(input.ptr, input.len, outputPtr);
    return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
  });
}

function decodeUrlImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): Uint8Array {
  const decodedLen = exports.base64_url_decode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(decodedLen);
    const actualLen = exports.base64_url_decode(input.ptr, input.len, outputPtr, decodedLen);
    return mem.copyOut(outputPtr, actualLen);
  });
}

function encodeUrlNoPaddingImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): string {
  const encodedLen = exports.base64_url_no_pad_encode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(encodedLen);
    const actualLen = exports.base64_url_no_pad_encode(input.ptr, input.len, outputPtr);
    return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
  });
}

function decodeUrlNoPaddingImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): Uint8Array {
  const decodedLen = exports.base64_url_no_pad_decode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(decodedLen);
    const actualLen = exports.base64_url_no_pad_decode(input.ptr, input.len, outputPtr, decodedLen);
    return mem.copyOut(outputPtr, actualLen);
  });
}

function hexEncodeImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): string {
  const encodedLen = exports.hex_encode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(encodedLen);
    const actualLen = exports.hex_encode(input.ptr, input.len, outputPtr);
    return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
  });
}

function hexDecodeImpl(exports: Base64WasmExports, mem: WasmMemory, data: Uint8Array): Uint8Array {
  const decodedLen = exports.hex_decode_len(data.length);
  return AllocationScope.use(mem, (scope: AllocationScopeType) => {
    const input = scope.allocAndCopy(data);
    const outputPtr = scope.alloc(decodedLen);
    const actualLen = exports.hex_decode(input.ptr, input.len, outputPtr);
    return mem.copyOut(outputPtr, actualLen);
  });
}

// ============================================================================
// Async API
// ============================================================================

/** Encode data to standard Base64 */
export async function encode(data: string | Uint8Array): Promise<string> {
  const { exports, memory } = await ensureInit();
  return encodeImpl(exports, memory, toBytes(data));
}

/** Decode standard Base64 to bytes */
export async function decode(str: string): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return decodeImpl(exports, memory, toBytes(str));
}

/** Encode data to Base64 without padding */
export async function encodeNoPadding(data: string | Uint8Array): Promise<string> {
  const { exports, memory } = await ensureInit();
  return encodeNoPaddingImpl(exports, memory, toBytes(data));
}

/** Decode Base64 without padding to bytes */
export async function decodeNoPadding(str: string): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return decodeNoPaddingImpl(exports, memory, toBytes(str));
}

/** Encode data to URL-safe Base64 */
export async function encodeUrl(data: string | Uint8Array): Promise<string> {
  const { exports, memory } = await ensureInit();
  return encodeUrlImpl(exports, memory, toBytes(data));
}

/** Decode URL-safe Base64 to bytes */
export async function decodeUrl(str: string): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return decodeUrlImpl(exports, memory, toBytes(str));
}

/** Encode data to URL-safe Base64 without padding */
export async function encodeUrlNoPadding(data: string | Uint8Array): Promise<string> {
  const { exports, memory } = await ensureInit();
  return encodeUrlNoPaddingImpl(exports, memory, toBytes(data));
}

/** Decode URL-safe Base64 without padding to bytes */
export async function decodeUrlNoPadding(str: string): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return decodeUrlNoPaddingImpl(exports, memory, toBytes(str));
}

/** Encode data to hexadecimal string */
export async function hexEncode(data: string | Uint8Array): Promise<string> {
  const { exports, memory } = await ensureInit();
  return hexEncodeImpl(exports, memory, toBytes(data));
}

/** Decode hexadecimal string to bytes */
export async function hexDecode(str: string): Promise<Uint8Array> {
  const { exports, memory } = await ensureInit();
  return hexDecodeImpl(exports, memory, toBytes(str));
}

// ============================================================================
// Sync API
// ============================================================================

/** Encode data to standard Base64 (sync) */
export function encodeSync(data: string | Uint8Array): string {
  const { exports, memory } = getSyncState();
  return encodeImpl(exports, memory, toBytes(data));
}

/** Decode standard Base64 to bytes (sync) */
export function decodeSync(str: string): Uint8Array {
  const { exports, memory } = getSyncState();
  return decodeImpl(exports, memory, toBytes(str));
}

/** Encode data to Base64 without padding (sync) */
export function encodeNoPaddingSync(data: string | Uint8Array): string {
  const { exports, memory } = getSyncState();
  return encodeNoPaddingImpl(exports, memory, toBytes(data));
}

/** Decode Base64 without padding to bytes (sync) */
export function decodeNoPaddingSync(str: string): Uint8Array {
  const { exports, memory } = getSyncState();
  return decodeNoPaddingImpl(exports, memory, toBytes(str));
}

/** Encode data to URL-safe Base64 (sync) */
export function encodeUrlSync(data: string | Uint8Array): string {
  const { exports, memory } = getSyncState();
  return encodeUrlImpl(exports, memory, toBytes(data));
}

/** Decode URL-safe Base64 to bytes (sync) */
export function decodeUrlSync(str: string): Uint8Array {
  const { exports, memory } = getSyncState();
  return decodeUrlImpl(exports, memory, toBytes(str));
}

/** Encode data to URL-safe Base64 without padding (sync) */
export function encodeUrlNoPaddingSync(data: string | Uint8Array): string {
  const { exports, memory } = getSyncState();
  return encodeUrlNoPaddingImpl(exports, memory, toBytes(data));
}

/** Decode URL-safe Base64 without padding to bytes (sync) */
export function decodeUrlNoPaddingSync(str: string): Uint8Array {
  const { exports, memory } = getSyncState();
  return decodeUrlNoPaddingImpl(exports, memory, toBytes(str));
}

/** Encode data to hexadecimal string (sync) */
export function hexEncodeSync(data: string | Uint8Array): string {
  const { exports, memory } = getSyncState();
  return hexEncodeImpl(exports, memory, toBytes(data));
}

/** Decode hexadecimal string to bytes (sync) */
export function hexDecodeSync(str: string): Uint8Array {
  const { exports, memory } = getSyncState();
  return hexDecodeImpl(exports, memory, toBytes(str));
}
