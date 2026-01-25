/**
 * Base64 and hexadecimal encoding/decoding implementation powered by Zig WebAssembly.
 *
 * This module provides the core implementation for all encoding operations.
 * It supports four Base64 variants and hexadecimal encoding:
 *
 * - **Standard Base64**: RFC 4648 compliant with `+`, `/`, and `=` padding
 * - **No Padding**: Standard alphabet without trailing `=` characters
 * - **URL-safe**: Uses `-` and `_` (safe for URLs and filenames)
 * - **URL-safe No Padding**: URL-safe without padding (e.g., JWT tokens)
 * - **Hexadecimal**: Lowercase hex encoding (`0-9a-f`)
 *
 * ## API Patterns
 *
 * **Async API** (recommended): Auto-initializes the WASM module on first use.
 * No setup required - just import and call.
 *
 * **Sync API**: Requires calling {@link init} first. Use when you need
 * synchronous operations in a hot path after initialization.
 *
 * @example Async API (auto-initializes)
 * ```ts
 * import { encode, decode, hexEncode } from "@zig-wasm/base64";
 *
 * // Encoding - accepts string or Uint8Array
 * const encoded = await encode("Hello, World!");
 * console.log(encoded); // "SGVsbG8sIFdvcmxkIQ=="
 *
 * // Decoding - returns Uint8Array
 * const bytes = await decode(encoded);
 * const text = new TextDecoder().decode(bytes);
 * console.log(text); // "Hello, World!"
 *
 * // Hex encoding
 * const hex = await hexEncode("hello");
 * console.log(hex); // "68656c6c6f"
 * ```
 *
 * @example Sync API (requires init)
 * ```ts
 * import { init, encodeSync, decodeSync } from "@zig-wasm/base64";
 *
 * // Must initialize before using sync functions
 * await init();
 *
 * // Now sync functions work
 * const encoded = encodeSync("Hello");
 * const decoded = decodeSync(encoded);
 * ```
 *
 * @example URL-safe encoding for JWTs
 * ```ts
 * import { encodeUrlNoPadding } from "@zig-wasm/base64";
 *
 * const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
 * const payload = JSON.stringify({ sub: "1234567890", name: "John" });
 *
 * const encodedHeader = await encodeUrlNoPadding(header);
 * const encodedPayload = await encodeUrlNoPadding(payload);
 * // Use for JWT: `${encodedHeader}.${encodedPayload}.${signature}`
 * ```
 *
 * @example Binary data handling
 * ```ts
 * import { encode, decode } from "@zig-wasm/base64";
 *
 * // Encode binary data
 * const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff]);
 * const encoded = await encode(binaryData);
 *
 * // Decode returns Uint8Array (preserves binary)
 * const decoded = await decode(encoded);
 * console.log(decoded); // Uint8Array [0, 1, 2, 255]
 * ```
 *
 * @see {@link encode} - Standard Base64 encoding
 * @see {@link decode} - Standard Base64 decoding
 * @see {@link encodeUrl} - URL-safe Base64 encoding
 * @see {@link hexEncode} - Hexadecimal encoding
 * @see {@link init} - Manual initialization for sync API
 *
 * @module base64
 */

import type {
	AllocationScope as AllocationScopeType,
	InitOptions,
} from '@zig-wasm/core';
import {
	AllocationScope,
	getEnvironment,
	loadWasm,
	NotInitializedError,
	WasmMemory,
} from '@zig-wasm/core';
import type { Base64WasmExports } from './types.ts';

// ============================================================================
// Utilities
// ============================================================================

function toBytes(data: string | Uint8Array): Uint8Array {
	if (typeof data === 'string') {
		return new TextEncoder().encode(data);
	}
	return data;
}

const textDecoder = new TextDecoder();

// ============================================================================
// Internal implementations
// ============================================================================

function encodeImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): string {
	if (data.length === 0) return '';
	const encodedLen = exports.base64_encode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(encodedLen);
		const actualLen = exports.base64_encode(input.ptr, input.len, outputPtr);
		return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
	});
}

function decodeImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): Uint8Array {
	if (data.length === 0) return new Uint8Array(0);
	const decodedLen = exports.base64_decode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(decodedLen);
		const actualLen = exports.base64_decode(
			input.ptr,
			input.len,
			outputPtr,
			decodedLen,
		);
		return mem.copyOut(outputPtr, actualLen);
	});
}

function encodeNoPaddingImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): string {
	if (data.length === 0) return '';
	const encodedLen = exports.base64_no_pad_encode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(encodedLen);
		const actualLen = exports.base64_no_pad_encode(
			input.ptr,
			input.len,
			outputPtr,
		);
		return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
	});
}

function decodeNoPaddingImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): Uint8Array {
	if (data.length === 0) return new Uint8Array(0);
	const decodedLen = exports.base64_no_pad_decode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(decodedLen);
		const actualLen = exports.base64_no_pad_decode(
			input.ptr,
			input.len,
			outputPtr,
			decodedLen,
		);
		return mem.copyOut(outputPtr, actualLen);
	});
}

function encodeUrlImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): string {
	if (data.length === 0) return '';
	const encodedLen = exports.base64_url_encode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(encodedLen);
		const actualLen = exports.base64_url_encode(
			input.ptr,
			input.len,
			outputPtr,
		);
		return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
	});
}

function decodeUrlImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): Uint8Array {
	if (data.length === 0) return new Uint8Array(0);
	const decodedLen = exports.base64_url_decode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(decodedLen);
		const actualLen = exports.base64_url_decode(
			input.ptr,
			input.len,
			outputPtr,
			decodedLen,
		);
		return mem.copyOut(outputPtr, actualLen);
	});
}

function encodeUrlNoPaddingImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): string {
	if (data.length === 0) return '';
	const encodedLen = exports.base64_url_no_pad_encode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(encodedLen);
		const actualLen = exports.base64_url_no_pad_encode(
			input.ptr,
			input.len,
			outputPtr,
		);
		return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
	});
}

function decodeUrlNoPaddingImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): Uint8Array {
	if (data.length === 0) return new Uint8Array(0);
	const decodedLen = exports.base64_url_no_pad_decode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(decodedLen);
		const actualLen = exports.base64_url_no_pad_decode(
			input.ptr,
			input.len,
			outputPtr,
			decodedLen,
		);
		return mem.copyOut(outputPtr, actualLen);
	});
}

function hexEncodeImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): string {
	if (data.length === 0) return '';
	const encodedLen = exports.hex_encode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(encodedLen);
		const actualLen = exports.hex_encode(input.ptr, input.len, outputPtr);
		return textDecoder.decode(mem.copyOut(outputPtr, actualLen));
	});
}

function hexDecodeImpl(
	exports: Base64WasmExports,
	mem: WasmMemory,
	data: Uint8Array,
): Uint8Array {
	if (data.length === 0) return new Uint8Array(0);
	const decodedLen = exports.hex_decode_len(data.length);
	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(decodedLen);
		const actualLen = exports.hex_decode(input.ptr, input.len, outputPtr);
		return mem.copyOut(outputPtr, actualLen);
	});
}

// ============================================================================
// Base64 Instance Interface
// ============================================================================

/**
 * Interface for a Base64 encoder/decoder instance.
 *
 * Contains all encoding/decoding methods along with lifecycle management.
 * Created by {@link createBase64}.
 */
export interface Base64Instance {
	/** Initialize the WASM module */
	init(options?: InitOptions): Promise<void>;
	/** Check if the module is initialized */
	isInitialized(): boolean;
	/** Reset all state, allowing re-initialization */
	dispose(): void;

	// Async API
	encode(data: string | Uint8Array): Promise<string>;
	decode(str: string): Promise<Uint8Array>;
	encodeNoPadding(data: string | Uint8Array): Promise<string>;
	decodeNoPadding(str: string): Promise<Uint8Array>;
	encodeUrl(data: string | Uint8Array): Promise<string>;
	decodeUrl(str: string): Promise<Uint8Array>;
	encodeUrlNoPadding(data: string | Uint8Array): Promise<string>;
	decodeUrlNoPadding(str: string): Promise<Uint8Array>;
	hexEncode(data: string | Uint8Array): Promise<string>;
	hexDecode(str: string): Promise<Uint8Array>;

	// Sync API
	encodeSync(data: string | Uint8Array): string;
	decodeSync(str: string): Uint8Array;
	encodeNoPaddingSync(data: string | Uint8Array): string;
	decodeNoPaddingSync(str: string): Uint8Array;
	encodeUrlSync(data: string | Uint8Array): string;
	decodeUrlSync(str: string): Uint8Array;
	encodeUrlNoPaddingSync(data: string | Uint8Array): string;
	decodeUrlNoPaddingSync(str: string): Uint8Array;
	hexEncodeSync(data: string | Uint8Array): string;
	hexDecodeSync(str: string): Uint8Array;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new Base64 encoder/decoder instance.
 *
 * This factory function creates an isolated instance with its own WASM module state.
 * Useful for scenarios requiring multiple independent instances or explicit lifecycle control.
 *
 * For most use cases, the default singleton exports are sufficient. Use this factory when:
 * - You need multiple independent instances (e.g., different WASM configurations)
 * - You want explicit control over instance lifecycle via `dispose()`
 * - You're building libraries that shouldn't share global state
 *
 * @returns A new {@link Base64Instance} with all encoding/decoding methods
 *
 * @example Basic usage
 * ```ts
 * import { createBase64 } from "@zig-wasm/base64";
 *
 * const base64 = createBase64();
 * await base64.init();
 *
 * const encoded = base64.encodeSync("Hello");
 * console.log(encoded); // "SGVsbG8="
 *
 * // Clean up when done
 * base64.dispose();
 * ```
 *
 * @example Multiple independent instances
 * ```ts
 * import { createBase64 } from "@zig-wasm/base64";
 *
 * const instance1 = createBase64();
 * const instance2 = createBase64();
 *
 * // Each instance has independent state
 * await instance1.init({ wasmPath: "./custom1.wasm" });
 * await instance2.init({ wasmPath: "./custom2.wasm" });
 *
 * // Dispose individually
 * instance1.dispose();
 * instance2.dispose();
 * ```
 */
export function createBase64(): Base64Instance {
	let wasmExports: Base64WasmExports | null = null;
	let wasmMemory: WasmMemory | null = null;
	let initPromise: Promise<void> | null = null;

	async function init(options?: InitOptions): Promise<void> {
		if (wasmExports) return;

		if (initPromise) {
			await initPromise;
			return;
		}

		initPromise = (async () => {
			const env = getEnvironment();
			let result: Awaited<ReturnType<typeof loadWasm<Base64WasmExports>>>;

			if (options?.wasmBytes) {
				result = await loadWasm<Base64WasmExports>({
					wasmBytes: options.wasmBytes,
					imports: options.imports,
				});
			} else if (options?.wasmPath) {
				result = await loadWasm<Base64WasmExports>({
					wasmPath: options.wasmPath,
					imports: options.imports,
				});
			} else if (options?.wasmUrl) {
				result = await loadWasm<Base64WasmExports>({
					wasmUrl: options.wasmUrl,
					imports: options.imports,
					fetchFn: options.fetchFn,
				});
			} else if (env.isNode || env.isBun) {
				const { fileURLToPath } = await import('node:url');
				const { dirname, join } = await import('node:path');
				const currentDir = dirname(fileURLToPath(import.meta.url));
				const wasmPath = join(currentDir, '../wasm/base64.wasm');
				result = await loadWasm<Base64WasmExports>({ wasmPath });
			} else {
				const wasmUrl = new URL('../wasm/base64.wasm', import.meta.url);
				result = await loadWasm<Base64WasmExports>({ wasmUrl: wasmUrl.href });
			}

			wasmExports = result.exports;
			wasmMemory = new WasmMemory(result.exports);
		})();

		await initPromise;
	}

	function isInitialized(): boolean {
		return wasmExports !== null;
	}

	function dispose(): void {
		wasmExports = null;
		wasmMemory = null;
		initPromise = null;
	}

	async function ensureInit(): Promise<{
		exports: Base64WasmExports;
		memory: WasmMemory;
	}> {
		await init();
		return {
			exports: wasmExports as Base64WasmExports,
			memory: wasmMemory as WasmMemory,
		};
	}

	function getSyncState(): { exports: Base64WasmExports; memory: WasmMemory } {
		if (!wasmExports || !wasmMemory) {
			throw new NotInitializedError('base64');
		}
		return { exports: wasmExports, memory: wasmMemory };
	}

	// Async API
	async function encode(data: string | Uint8Array): Promise<string> {
		const { exports, memory } = await ensureInit();
		return encodeImpl(exports, memory, toBytes(data));
	}

	async function decode(str: string): Promise<Uint8Array> {
		const { exports, memory } = await ensureInit();
		return decodeImpl(exports, memory, toBytes(str));
	}

	async function encodeNoPadding(data: string | Uint8Array): Promise<string> {
		const { exports, memory } = await ensureInit();
		return encodeNoPaddingImpl(exports, memory, toBytes(data));
	}

	async function decodeNoPadding(str: string): Promise<Uint8Array> {
		const { exports, memory } = await ensureInit();
		return decodeNoPaddingImpl(exports, memory, toBytes(str));
	}

	async function encodeUrl(data: string | Uint8Array): Promise<string> {
		const { exports, memory } = await ensureInit();
		return encodeUrlImpl(exports, memory, toBytes(data));
	}

	async function decodeUrl(str: string): Promise<Uint8Array> {
		const { exports, memory } = await ensureInit();
		return decodeUrlImpl(exports, memory, toBytes(str));
	}

	async function encodeUrlNoPadding(
		data: string | Uint8Array,
	): Promise<string> {
		const { exports, memory } = await ensureInit();
		return encodeUrlNoPaddingImpl(exports, memory, toBytes(data));
	}

	async function decodeUrlNoPadding(str: string): Promise<Uint8Array> {
		const { exports, memory } = await ensureInit();
		return decodeUrlNoPaddingImpl(exports, memory, toBytes(str));
	}

	async function hexEncode(data: string | Uint8Array): Promise<string> {
		const { exports, memory } = await ensureInit();
		return hexEncodeImpl(exports, memory, toBytes(data));
	}

	async function hexDecode(str: string): Promise<Uint8Array> {
		const { exports, memory } = await ensureInit();
		return hexDecodeImpl(exports, memory, toBytes(str));
	}

	// Sync API
	function encodeSync(data: string | Uint8Array): string {
		const { exports, memory } = getSyncState();
		return encodeImpl(exports, memory, toBytes(data));
	}

	function decodeSync(str: string): Uint8Array {
		const { exports, memory } = getSyncState();
		return decodeImpl(exports, memory, toBytes(str));
	}

	function encodeNoPaddingSync(data: string | Uint8Array): string {
		const { exports, memory } = getSyncState();
		return encodeNoPaddingImpl(exports, memory, toBytes(data));
	}

	function decodeNoPaddingSync(str: string): Uint8Array {
		const { exports, memory } = getSyncState();
		return decodeNoPaddingImpl(exports, memory, toBytes(str));
	}

	function encodeUrlSync(data: string | Uint8Array): string {
		const { exports, memory } = getSyncState();
		return encodeUrlImpl(exports, memory, toBytes(data));
	}

	function decodeUrlSync(str: string): Uint8Array {
		const { exports, memory } = getSyncState();
		return decodeUrlImpl(exports, memory, toBytes(str));
	}

	function encodeUrlNoPaddingSync(data: string | Uint8Array): string {
		const { exports, memory } = getSyncState();
		return encodeUrlNoPaddingImpl(exports, memory, toBytes(data));
	}

	function decodeUrlNoPaddingSync(str: string): Uint8Array {
		const { exports, memory } = getSyncState();
		return decodeUrlNoPaddingImpl(exports, memory, toBytes(str));
	}

	function hexEncodeSync(data: string | Uint8Array): string {
		const { exports, memory } = getSyncState();
		return hexEncodeImpl(exports, memory, toBytes(data));
	}

	function hexDecodeSync(str: string): Uint8Array {
		const { exports, memory } = getSyncState();
		return hexDecodeImpl(exports, memory, toBytes(str));
	}

	return {
		init,
		isInitialized,
		dispose,
		encode,
		decode,
		encodeNoPadding,
		decodeNoPadding,
		encodeUrl,
		decodeUrl,
		encodeUrlNoPadding,
		decodeUrlNoPadding,
		hexEncode,
		hexDecode,
		encodeSync,
		decodeSync,
		encodeNoPaddingSync,
		decodeNoPaddingSync,
		encodeUrlSync,
		decodeUrlSync,
		encodeUrlNoPaddingSync,
		decodeUrlNoPaddingSync,
		hexEncodeSync,
		hexDecodeSync,
	};
}

// ============================================================================
// Default singleton instance for backwards compatibility
// ============================================================================

const _defaultInstance = createBase64();

/**
 * Initialize the Base64 WebAssembly module.
 *
 * This function is **idempotent** and **concurrency-safe**. Multiple calls
 * will return the same promise, and the module is only loaded once.
 *
 * **When to call**: Required before using sync functions (`*Sync`).
 * Async functions call this automatically.
 *
 * @param options - Optional configuration for loading the WASM module
 * @returns A promise that resolves when initialization is complete
 *
 * @example Basic initialization
 * ```ts
 * import { init, encodeSync } from "@zig-wasm/base64";
 *
 * await init();
 * const result = encodeSync("Hello"); // Now works!
 * ```
 *
 * @example Custom WASM path
 * ```ts
 * import { init } from "@zig-wasm/base64";
 *
 * await init({ wasmPath: "/custom/path/base64.wasm" });
 * ```
 *
 * @example Pre-loaded WASM bytes
 * ```ts
 * import { init } from "@zig-wasm/base64";
 *
 * const wasmBytes = await fetch("/base64.wasm").then(r => r.arrayBuffer());
 * await init({ wasmBytes: new Uint8Array(wasmBytes) });
 * ```
 */
export const init = _defaultInstance.init;

/**
 * Check if the Base64 module has been initialized.
 *
 * Useful for conditional logic or debugging. Returns `true` if {@link init}
 * has completed successfully.
 *
 * @returns `true` if the module is ready for use, `false` otherwise
 *
 * @example
 * ```ts
 * import { init, isInitialized, encodeSync } from "@zig-wasm/base64";
 *
 * console.log(isInitialized()); // false
 *
 * await init();
 * console.log(isInitialized()); // true
 *
 * // Safe to use sync API now
 * const result = encodeSync("test");
 * ```
 */
export const isInitialized = _defaultInstance.isInitialized;

/**
 * Reset the default Base64 instance state.
 *
 * Clears all internal state including WASM exports, memory, and initialization promise.
 * After calling dispose, the module must be re-initialized before use.
 *
 * Useful for testing or when you need to reinitialize with different options.
 *
 * @example
 * ```ts
 * import { init, dispose, isInitialized } from "@zig-wasm/base64";
 *
 * await init();
 * console.log(isInitialized()); // true
 *
 * dispose();
 * console.log(isInitialized()); // false
 *
 * // Can reinitialize with different options
 * await init({ wasmPath: "./other.wasm" });
 * ```
 */
export const dispose = _defaultInstance.dispose;

// ============================================================================
// Async API exports
// ============================================================================

/**
 * Encode data to standard Base64 (RFC 4648).
 *
 * Uses the standard alphabet (`A-Z`, `a-z`, `0-9`, `+`, `/`) with `=` padding.
 * Auto-initializes the WASM module on first call.
 *
 * @param data - The data to encode (string or bytes)
 * @returns A promise resolving to the Base64-encoded string
 *
 * @example Encode a string
 * ```ts
 * import { encode } from "@zig-wasm/base64";
 *
 * const result = await encode("Hello, World!");
 * console.log(result); // "SGVsbG8sIFdvcmxkIQ=="
 * ```
 *
 * @example Encode binary data
 * ```ts
 * import { encode } from "@zig-wasm/base64";
 *
 * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
 * const result = await encode(bytes);
 * console.log(result); // "SGVsbG8="
 * ```
 */
export const encode = _defaultInstance.encode;

/**
 * Decode standard Base64 to bytes.
 *
 * Decodes RFC 4648 Base64 with standard alphabet and padding.
 * Auto-initializes the WASM module on first call.
 *
 * @param str - The Base64-encoded string to decode
 * @returns A promise resolving to the decoded bytes
 *
 * @example Decode to string
 * ```ts
 * import { decode } from "@zig-wasm/base64";
 *
 * const bytes = await decode("SGVsbG8sIFdvcmxkIQ==");
 * const text = new TextDecoder().decode(bytes);
 * console.log(text); // "Hello, World!"
 * ```
 *
 * @example Decode binary data
 * ```ts
 * import { decode } from "@zig-wasm/base64";
 *
 * const bytes = await decode("AAEC/w==");
 * console.log(bytes); // Uint8Array [0, 1, 2, 255]
 * ```
 */
export const decode = _defaultInstance.decode;

/**
 * Encode data to Base64 without padding.
 *
 * Uses standard alphabet but omits trailing `=` characters.
 * Auto-initializes the WASM module on first call.
 *
 * @param data - The data to encode (string or bytes)
 * @returns A promise resolving to the Base64-encoded string without padding
 *
 * @example
 * ```ts
 * import { encodeNoPadding } from "@zig-wasm/base64";
 *
 * const result = await encodeNoPadding("Hello");
 * console.log(result); // "SGVsbG8" (no trailing =)
 * ```
 */
export const encodeNoPadding = _defaultInstance.encodeNoPadding;

/**
 * Decode Base64 without padding to bytes.
 *
 * Decodes Base64 that was encoded without padding characters.
 * Auto-initializes the WASM module on first call.
 *
 * @param str - The Base64-encoded string (without padding)
 * @returns A promise resolving to the decoded bytes
 *
 * @example
 * ```ts
 * import { decodeNoPadding } from "@zig-wasm/base64";
 *
 * const bytes = await decodeNoPadding("SGVsbG8");
 * console.log(new TextDecoder().decode(bytes)); // "Hello"
 * ```
 */
export const decodeNoPadding = _defaultInstance.decodeNoPadding;

/**
 * Encode data to URL-safe Base64.
 *
 * Uses URL-safe alphabet (`-` instead of `+`, `_` instead of `/`) with `=` padding.
 * Safe for use in URLs and filenames.
 * Auto-initializes the WASM module on first call.
 *
 * @param data - The data to encode (string or bytes)
 * @returns A promise resolving to the URL-safe Base64-encoded string
 *
 * @example
 * ```ts
 * import { encodeUrl } from "@zig-wasm/base64";
 *
 * const result = await encodeUrl("Hello?World!");
 * console.log(result); // Uses - and _ instead of + and /
 * ```
 */
export const encodeUrl = _defaultInstance.encodeUrl;

/**
 * Decode URL-safe Base64 to bytes.
 *
 * Decodes URL-safe Base64 (uses `-` and `_`) with padding.
 * Auto-initializes the WASM module on first call.
 *
 * @param str - The URL-safe Base64-encoded string
 * @returns A promise resolving to the decoded bytes
 *
 * @example
 * ```ts
 * import { decodeUrl } from "@zig-wasm/base64";
 *
 * const bytes = await decodeUrl("SGVsbG8_V29ybGQh");
 * console.log(new TextDecoder().decode(bytes));
 * ```
 */
export const decodeUrl = _defaultInstance.decodeUrl;

/**
 * Encode data to URL-safe Base64 without padding.
 *
 * Uses URL-safe alphabet and omits padding. Ideal for JWTs and URL parameters.
 * Auto-initializes the WASM module on first call.
 *
 * @param data - The data to encode (string or bytes)
 * @returns A promise resolving to URL-safe Base64 without padding
 *
 * @example JWT header/payload encoding
 * ```ts
 * import { encodeUrlNoPadding } from "@zig-wasm/base64";
 *
 * const header = JSON.stringify({ alg: "HS256", typ: "JWT" });
 * const encoded = await encodeUrlNoPadding(header);
 * // Use in JWT: encoded is URL-safe with no padding
 * ```
 */
export const encodeUrlNoPadding = _defaultInstance.encodeUrlNoPadding;

/**
 * Decode URL-safe Base64 without padding to bytes.
 *
 * Decodes URL-safe Base64 without padding characters.
 * Auto-initializes the WASM module on first call.
 *
 * @param str - The URL-safe Base64-encoded string (no padding)
 * @returns A promise resolving to the decoded bytes
 *
 * @example
 * ```ts
 * import { decodeUrlNoPadding } from "@zig-wasm/base64";
 *
 * const bytes = await decodeUrlNoPadding("eyJhbGciOiJIUzI1NiJ9");
 * const json = JSON.parse(new TextDecoder().decode(bytes));
 * console.log(json); // { alg: "HS256" }
 * ```
 */
export const decodeUrlNoPadding = _defaultInstance.decodeUrlNoPadding;

/**
 * Encode data to lowercase hexadecimal string.
 *
 * Each byte becomes two hex characters (`00`-`ff`).
 * Auto-initializes the WASM module on first call.
 *
 * @param data - The data to encode (string or bytes)
 * @returns A promise resolving to the hex-encoded string
 *
 * @example
 * ```ts
 * import { hexEncode } from "@zig-wasm/base64";
 *
 * const hex = await hexEncode("hello");
 * console.log(hex); // "68656c6c6f"
 *
 * const bytes = new Uint8Array([0, 255, 16]);
 * console.log(await hexEncode(bytes)); // "00ff10"
 * ```
 */
export const hexEncode = _defaultInstance.hexEncode;

/**
 * Decode hexadecimal string to bytes.
 *
 * Parses lowercase hex characters (`0-9`, `a-f`) to bytes.
 * Auto-initializes the WASM module on first call.
 *
 * @param str - The hex-encoded string
 * @returns A promise resolving to the decoded bytes
 *
 * @example
 * ```ts
 * import { hexDecode } from "@zig-wasm/base64";
 *
 * const bytes = await hexDecode("68656c6c6f");
 * console.log(new TextDecoder().decode(bytes)); // "hello"
 *
 * const binary = await hexDecode("00ff10");
 * console.log(binary); // Uint8Array [0, 255, 16]
 * ```
 */
export const hexDecode = _defaultInstance.hexDecode;

// ============================================================================
// Sync API exports
// ============================================================================

/**
 * Encode data to standard Base64 (synchronous).
 *
 * **Requires {@link init} to be called first.**
 * Throws {@link NotInitializedError} if module not initialized.
 *
 * @param data - The data to encode (string or bytes)
 * @returns The Base64-encoded string
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, encodeSync } from "@zig-wasm/base64";
 *
 * await init(); // Required!
 * const result = encodeSync("Hello, World!");
 * console.log(result); // "SGVsbG8sIFdvcmxkIQ=="
 * ```
 */
export const encodeSync = _defaultInstance.encodeSync;

/**
 * Decode standard Base64 to bytes (synchronous).
 *
 * **Requires {@link init} to be called first.**
 * Throws {@link NotInitializedError} if module not initialized.
 *
 * @param str - The Base64-encoded string to decode
 * @returns The decoded bytes
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, decodeSync } from "@zig-wasm/base64";
 *
 * await init();
 * const bytes = decodeSync("SGVsbG8=");
 * console.log(new TextDecoder().decode(bytes)); // "Hello"
 * ```
 */
export const decodeSync = _defaultInstance.decodeSync;

/**
 * Encode data to Base64 without padding (synchronous).
 *
 * **Requires {@link init} to be called first.**
 *
 * @param data - The data to encode (string or bytes)
 * @returns The Base64-encoded string without padding
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, encodeNoPaddingSync } from "@zig-wasm/base64";
 *
 * await init();
 * const result = encodeNoPaddingSync("Hello");
 * console.log(result); // "SGVsbG8"
 * ```
 */
export const encodeNoPaddingSync = _defaultInstance.encodeNoPaddingSync;

/**
 * Decode Base64 without padding to bytes (synchronous).
 *
 * **Requires {@link init} to be called first.**
 *
 * @param str - The Base64-encoded string (without padding)
 * @returns The decoded bytes
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, decodeNoPaddingSync } from "@zig-wasm/base64";
 *
 * await init();
 * const bytes = decodeNoPaddingSync("SGVsbG8");
 * console.log(new TextDecoder().decode(bytes)); // "Hello"
 * ```
 */
export const decodeNoPaddingSync = _defaultInstance.decodeNoPaddingSync;

/**
 * Encode data to URL-safe Base64 (synchronous).
 *
 * **Requires {@link init} to be called first.**
 *
 * @param data - The data to encode (string or bytes)
 * @returns The URL-safe Base64-encoded string
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, encodeUrlSync } from "@zig-wasm/base64";
 *
 * await init();
 * const result = encodeUrlSync("Hello?");
 * console.log(result); // URL-safe encoding
 * ```
 */
export const encodeUrlSync = _defaultInstance.encodeUrlSync;

/**
 * Decode URL-safe Base64 to bytes (synchronous).
 *
 * **Requires {@link init} to be called first.**
 *
 * @param str - The URL-safe Base64-encoded string
 * @returns The decoded bytes
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, decodeUrlSync } from "@zig-wasm/base64";
 *
 * await init();
 * const bytes = decodeUrlSync("SGVsbG8_");
 * ```
 */
export const decodeUrlSync = _defaultInstance.decodeUrlSync;

/**
 * Encode data to URL-safe Base64 without padding (synchronous).
 *
 * **Requires {@link init} to be called first.**
 *
 * @param data - The data to encode (string or bytes)
 * @returns URL-safe Base64 without padding
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, encodeUrlNoPaddingSync } from "@zig-wasm/base64";
 *
 * await init();
 * const jwt = encodeUrlNoPaddingSync(JSON.stringify({ alg: "HS256" }));
 * ```
 */
export const encodeUrlNoPaddingSync = _defaultInstance.encodeUrlNoPaddingSync;

/**
 * Decode URL-safe Base64 without padding to bytes (synchronous).
 *
 * **Requires {@link init} to be called first.**
 *
 * @param str - The URL-safe Base64-encoded string (no padding)
 * @returns The decoded bytes
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, decodeUrlNoPaddingSync } from "@zig-wasm/base64";
 *
 * await init();
 * const bytes = decodeUrlNoPaddingSync("eyJhbGciOiJIUzI1NiJ9");
 * ```
 */
export const decodeUrlNoPaddingSync = _defaultInstance.decodeUrlNoPaddingSync;

/**
 * Encode data to hexadecimal string (synchronous).
 *
 * **Requires {@link init} to be called first.**
 *
 * @param data - The data to encode (string or bytes)
 * @returns The hex-encoded string (lowercase)
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, hexEncodeSync } from "@zig-wasm/base64";
 *
 * await init();
 * const hex = hexEncodeSync("hello");
 * console.log(hex); // "68656c6c6f"
 * ```
 */
export const hexEncodeSync = _defaultInstance.hexEncodeSync;

/**
 * Decode hexadecimal string to bytes (synchronous).
 *
 * **Requires {@link init} to be called first.**
 *
 * @param str - The hex-encoded string
 * @returns The decoded bytes
 * @throws {NotInitializedError} If {@link init} was not called
 *
 * @example
 * ```ts
 * import { init, hexDecodeSync } from "@zig-wasm/base64";
 *
 * await init();
 * const bytes = hexDecodeSync("68656c6c6f");
 * console.log(new TextDecoder().decode(bytes)); // "hello"
 * ```
 */
export const hexDecodeSync = _defaultInstance.hexDecodeSync;
