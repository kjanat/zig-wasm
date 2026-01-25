/**
 * Cryptographic hash functions and HMAC implementation.
 *
 * This module provides the core implementation for all hash and HMAC operations.
 * It supports both async (auto-initializing) and sync (requires {@link init}) APIs.
 *
 * ## Supported Hash Algorithms
 *
 * - **MD5** - 128-bit, legacy (not secure)
 * - **SHA-1** - 160-bit, legacy (not secure)
 * - **SHA-2** - SHA-256, SHA-384, SHA-512 (recommended)
 * - **SHA-3** - SHA3-256, SHA3-512 (Keccak-based)
 * - **BLAKE2** - BLAKE2b-256, BLAKE2s-256 (fast and secure)
 * - **BLAKE3** - 256-bit (fastest, modern)
 *
 * ## Supported HMAC Algorithms
 *
 * - **HMAC-SHA256** - 256-bit output
 * - **HMAC-SHA512** - 512-bit output
 *
 * @example Basic hashing
 * ```ts
 * import { sha256, blake3, hashHex } from "@zig-wasm/crypto";
 *
 * // Using algorithm-specific functions
 * const hash = await sha256("Hello, World!");
 * console.log(hash); // Uint8Array(32)
 *
 * // Using generic hash function with hex output
 * const hex = await hashHex("blake3", "Hello, World!");
 * console.log(hex); // "ede5c0b10f2ec4979c69b52f61e42ff5b413519ce09be0f14d098dcfe5f6f98d"
 * ```
 *
 * @example HMAC authentication
 * ```ts
 * import { hmacSha256, hmacHex } from "@zig-wasm/crypto";
 *
 * // Generate HMAC for API authentication
 * const signature = await hmacSha256("secret-key", "request-body");
 *
 * // Get HMAC as hex string
 * const signatureHex = await hmacHex("sha256", "secret-key", "request-body");
 * ```
 *
 * @example Sync API usage
 * ```ts
 * import { init, sha256Sync, hmacSha256Sync } from "@zig-wasm/crypto";
 *
 * // Must initialize first for sync API
 * await init();
 *
 * // Now sync functions work without await
 * const hash = sha256Sync("Hello");
 * const mac = hmacSha256Sync("key", "data");
 * ```
 *
 * @module crypto
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
	toHex,
	WasmMemory,
} from '@zig-wasm/core';
import type {
	CryptoWasmExports,
	HashAlgorithm,
	HmacAlgorithm,
} from './types.ts';

// ============================================================================
// Types
// ============================================================================

/**
 * Crypto instance returned by the factory function.
 *
 * Contains all cryptographic functions with encapsulated state.
 */
export interface CryptoInstance {
	// Lifecycle
	init: (options?: InitOptions) => Promise<void>;
	isInitialized: () => boolean;
	dispose: () => void;

	// Async API
	hash: (
		algorithm: HashAlgorithm,
		data: string | Uint8Array,
	) => Promise<Uint8Array>;
	hashHex: (
		algorithm: HashAlgorithm,
		data: string | Uint8Array,
	) => Promise<string>;
	md5: (data: string | Uint8Array) => Promise<Uint8Array>;
	sha1: (data: string | Uint8Array) => Promise<Uint8Array>;
	sha256: (data: string | Uint8Array) => Promise<Uint8Array>;
	sha384: (data: string | Uint8Array) => Promise<Uint8Array>;
	sha512: (data: string | Uint8Array) => Promise<Uint8Array>;
	sha3_256: (data: string | Uint8Array) => Promise<Uint8Array>;
	sha3_512: (data: string | Uint8Array) => Promise<Uint8Array>;
	blake2b256: (data: string | Uint8Array) => Promise<Uint8Array>;
	blake2s256: (data: string | Uint8Array) => Promise<Uint8Array>;
	blake3: (data: string | Uint8Array) => Promise<Uint8Array>;
	hmac: (
		algorithm: HmacAlgorithm,
		key: string | Uint8Array,
		data: string | Uint8Array,
	) => Promise<Uint8Array>;
	hmacHex: (
		algorithm: HmacAlgorithm,
		key: string | Uint8Array,
		data: string | Uint8Array,
	) => Promise<string>;
	hmacSha256: (
		key: string | Uint8Array,
		data: string | Uint8Array,
	) => Promise<Uint8Array>;
	hmacSha512: (
		key: string | Uint8Array,
		data: string | Uint8Array,
	) => Promise<Uint8Array>;
	getHashDigestLength: (algorithm: HashAlgorithm) => Promise<number>;

	// Sync API
	hashSync: (algorithm: HashAlgorithm, data: string | Uint8Array) => Uint8Array;
	hashHexSync: (algorithm: HashAlgorithm, data: string | Uint8Array) => string;
	md5Sync: (data: string | Uint8Array) => Uint8Array;
	sha1Sync: (data: string | Uint8Array) => Uint8Array;
	sha256Sync: (data: string | Uint8Array) => Uint8Array;
	sha384Sync: (data: string | Uint8Array) => Uint8Array;
	sha512Sync: (data: string | Uint8Array) => Uint8Array;
	sha3_256Sync: (data: string | Uint8Array) => Uint8Array;
	sha3_512Sync: (data: string | Uint8Array) => Uint8Array;
	blake2b256Sync: (data: string | Uint8Array) => Uint8Array;
	blake2s256Sync: (data: string | Uint8Array) => Uint8Array;
	blake3Sync: (data: string | Uint8Array) => Uint8Array;
	hmacSync: (
		algorithm: HmacAlgorithm,
		key: string | Uint8Array,
		data: string | Uint8Array,
	) => Uint8Array;
	hmacHexSync: (
		algorithm: HmacAlgorithm,
		key: string | Uint8Array,
		data: string | Uint8Array,
	) => string;
	hmacSha256Sync: (
		key: string | Uint8Array,
		data: string | Uint8Array,
	) => Uint8Array;
	hmacSha512Sync: (
		key: string | Uint8Array,
		data: string | Uint8Array,
	) => Uint8Array;
	getHashDigestLengthSync: (algorithm: HashAlgorithm) => number;
}

// ============================================================================
// Utilities (shared, stateless)
// ============================================================================

/** Convert input to Uint8Array */
function toBytes(data: string | Uint8Array): Uint8Array {
	if (typeof data === 'string') {
		return new TextEncoder().encode(data);
	}
	return data;
}

function getHashFunction(
	exports: CryptoWasmExports,
	algorithm: HashAlgorithm,
): (dataPtr: number, dataLen: number, outPtr: number) => void {
	switch (algorithm) {
		case 'md5':
			return exports.md5_hash;
		case 'sha1':
			return exports.sha1_hash;
		case 'sha256':
			return exports.sha256_hash;
		case 'sha384':
			return exports.sha384_hash;
		case 'sha512':
			return exports.sha512_hash;
		case 'sha3-256':
			return exports.sha3_256_hash;
		case 'sha3-512':
			return exports.sha3_512_hash;
		case 'blake2b256':
			return exports.blake2b256_hash;
		case 'blake2s256':
			return exports.blake2s256_hash;
		case 'blake3':
			return exports.blake3_hash;
	}
}

function getDigestLength(
	exports: CryptoWasmExports,
	algorithm: HashAlgorithm,
): number {
	switch (algorithm) {
		case 'md5':
			return exports.md5_digest_length();
		case 'sha1':
			return exports.sha1_digest_length();
		case 'sha256':
			return exports.sha256_digest_length();
		case 'sha384':
			return exports.sha384_digest_length();
		case 'sha512':
			return exports.sha512_digest_length();
		case 'sha3-256':
			return exports.sha3_256_digest_length();
		case 'sha3-512':
			return exports.sha3_512_digest_length();
		case 'blake2b256':
			return exports.blake2b256_digest_length();
		case 'blake2s256':
			return exports.blake2s256_digest_length();
		case 'blake3':
			return exports.blake3_digest_length();
	}
}

function hashImpl(
	exports: CryptoWasmExports,
	mem: WasmMemory,
	algorithm: HashAlgorithm,
	data: Uint8Array,
): Uint8Array {
	const hashFn = getHashFunction(exports, algorithm);
	const digestLen = getDigestLength(exports, algorithm);

	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const input = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(digestLen);
		hashFn(input.ptr, input.len, outputPtr);
		return mem.copyOut(outputPtr, digestLen);
	});
}

function hmacImpl(
	exports: CryptoWasmExports,
	mem: WasmMemory,
	algorithm: HmacAlgorithm,
	key: Uint8Array,
	data: Uint8Array,
): Uint8Array {
	const hmacFn =
		algorithm === 'sha256' ? exports.hmac_sha256 : exports.hmac_sha512;
	const outputLen =
		algorithm === 'sha256'
			? exports.hmac_sha256_length()
			: exports.hmac_sha512_length();

	return AllocationScope.use(mem, (scope: AllocationScopeType) => {
		const keyInput = scope.allocAndCopy(key);
		const dataInput = scope.allocAndCopy(data);
		const outputPtr = scope.alloc(outputLen);
		hmacFn(keyInput.ptr, keyInput.len, dataInput.ptr, dataInput.len, outputPtr);
		return mem.copyOut(outputPtr, outputLen);
	});
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new crypto instance with isolated state.
 *
 * This factory function creates an independent crypto instance that encapsulates
 * all WASM state. Useful for:
 * - Testing with isolated state
 * - Multiple independent crypto contexts
 * - Explicit resource cleanup via `dispose()`
 *
 * For most use cases, the default exported functions are recommended as they
 * use a shared singleton instance.
 *
 * @returns A new crypto instance with all hash and HMAC functions
 *
 * @example Creating an isolated instance
 * ```ts
 * import { createCrypto } from "@zig-wasm/crypto";
 *
 * const crypto = createCrypto();
 * await crypto.init();
 *
 * const hash = crypto.sha256Sync("Hello");
 *
 * // Clean up when done
 * crypto.dispose();
 * ```
 *
 * @example Multiple independent instances
 * ```ts
 * import { createCrypto } from "@zig-wasm/crypto";
 *
 * const crypto1 = createCrypto();
 * const crypto2 = createCrypto();
 *
 * await Promise.all([crypto1.init(), crypto2.init()]);
 *
 * // Each instance has independent state
 * crypto1.dispose(); // Does not affect crypto2
 * ```
 */
export function createCrypto(): CryptoInstance {
	// ============================================================================
	// Instance State
	// ============================================================================

	let wasmExports: CryptoWasmExports | null = null;
	let wasmMemory: WasmMemory | null = null;
	let initPromise: Promise<void> | null = null;

	// ============================================================================
	// Lifecycle Functions
	// ============================================================================

	/**
	 * Initialize the crypto WASM module.
	 *
	 * This function is idempotent and concurrency-safe. Multiple calls will
	 * return the same initialization promise.
	 *
	 * **When to call:**
	 * - Required before using any sync API functions (e.g., {@link sha256Sync})
	 * - Not required for async API - it auto-initializes
	 *
	 * **Loading priority:**
	 * 1. `wasmBytes` - Use provided ArrayBuffer directly
	 * 2. `wasmPath` - Load from filesystem path (Node.js/Bun)
	 * 3. `wasmUrl` - Fetch from URL (browsers)
	 * 4. Auto-detect - Uses filesystem in Node.js/Bun, URL in browsers
	 *
	 * @param options - Optional configuration for WASM loading
	 * @returns Promise that resolves when initialization is complete
	 */
	async function init(options?: InitOptions): Promise<void> {
		if (wasmExports) return;

		if (initPromise) {
			await initPromise;
			return;
		}

		initPromise = (async () => {
			const env = getEnvironment();
			let result: Awaited<ReturnType<typeof loadWasm<CryptoWasmExports>>>;

			if (options?.wasmBytes) {
				result = await loadWasm<CryptoWasmExports>({
					wasmBytes: options.wasmBytes,
					imports: options.imports,
				});
			} else if (options?.wasmPath) {
				result = await loadWasm<CryptoWasmExports>({
					wasmPath: options.wasmPath,
					imports: options.imports,
				});
			} else if (options?.wasmUrl) {
				result = await loadWasm<CryptoWasmExports>({
					wasmUrl: options.wasmUrl,
					imports: options.imports,
					fetchFn: options.fetchFn,
				});
			} else if (env.isNode || env.isBun) {
				const { fileURLToPath } = await import('node:url');
				const { dirname, join } = await import('node:path');
				const currentDir = dirname(fileURLToPath(import.meta.url));
				const wasmPath = join(currentDir, '../wasm/crypto.wasm');
				result = await loadWasm<CryptoWasmExports>({ wasmPath });
			} else {
				const wasmUrl = new URL('../wasm/crypto.wasm', import.meta.url);
				result = await loadWasm<CryptoWasmExports>({ wasmUrl: wasmUrl.href });
			}

			wasmExports = result.exports;
			wasmMemory = new WasmMemory(result.exports);
		})();

		await initPromise;
	}

	/**
	 * Check if the crypto module has been initialized.
	 *
	 * @returns `true` if {@link init} has completed successfully, `false` otherwise
	 */
	function isInitialized(): boolean {
		return wasmExports !== null;
	}

	/**
	 * Dispose of the crypto instance and release all resources.
	 *
	 * After calling dispose, the instance can be re-initialized by calling init() again.
	 */
	function dispose(): void {
		wasmExports = null;
		wasmMemory = null;
		initPromise = null;
	}

	// ============================================================================
	// Internal Helpers
	// ============================================================================

	async function ensureInit(): Promise<{
		exports: CryptoWasmExports;
		memory: WasmMemory;
	}> {
		await init();
		return {
			exports: wasmExports as CryptoWasmExports,
			memory: wasmMemory as WasmMemory,
		};
	}

	function getSyncState(): { exports: CryptoWasmExports; memory: WasmMemory } {
		if (!wasmExports || !wasmMemory) {
			throw new NotInitializedError('crypto');
		}
		return { exports: wasmExports, memory: wasmMemory };
	}

	// ============================================================================
	// Async API (auto-initializes)
	// ============================================================================

	async function hash(
		algorithm: HashAlgorithm,
		data: string | Uint8Array,
	): Promise<Uint8Array> {
		const { exports, memory } = await ensureInit();
		return hashImpl(exports, memory, algorithm, toBytes(data));
	}

	async function hashHex(
		algorithm: HashAlgorithm,
		data: string | Uint8Array,
	): Promise<string> {
		return toHex(await hash(algorithm, data));
	}

	async function md5(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('md5', data);
	}

	async function sha1(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('sha1', data);
	}

	async function sha256(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('sha256', data);
	}

	async function sha384(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('sha384', data);
	}

	async function sha512(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('sha512', data);
	}

	async function sha3_256(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('sha3-256', data);
	}

	async function sha3_512(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('sha3-512', data);
	}

	async function blake2b256(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('blake2b256', data);
	}

	async function blake2s256(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('blake2s256', data);
	}

	async function blake3(data: string | Uint8Array): Promise<Uint8Array> {
		return hash('blake3', data);
	}

	async function hmac(
		algorithm: HmacAlgorithm,
		key: string | Uint8Array,
		data: string | Uint8Array,
	): Promise<Uint8Array> {
		const { exports, memory } = await ensureInit();
		return hmacImpl(exports, memory, algorithm, toBytes(key), toBytes(data));
	}

	async function hmacHex(
		algorithm: HmacAlgorithm,
		key: string | Uint8Array,
		data: string | Uint8Array,
	): Promise<string> {
		return toHex(await hmac(algorithm, key, data));
	}

	async function hmacSha256(
		key: string | Uint8Array,
		data: string | Uint8Array,
	): Promise<Uint8Array> {
		return hmac('sha256', key, data);
	}

	async function hmacSha512(
		key: string | Uint8Array,
		data: string | Uint8Array,
	): Promise<Uint8Array> {
		return hmac('sha512', key, data);
	}

	async function getHashDigestLength(
		algorithm: HashAlgorithm,
	): Promise<number> {
		const { exports } = await ensureInit();
		return getDigestLength(exports, algorithm);
	}

	// ============================================================================
	// Sync API (requires init() first)
	// ============================================================================

	function hashSync(
		algorithm: HashAlgorithm,
		data: string | Uint8Array,
	): Uint8Array {
		const { exports, memory } = getSyncState();
		return hashImpl(exports, memory, algorithm, toBytes(data));
	}

	function hashHexSync(
		algorithm: HashAlgorithm,
		data: string | Uint8Array,
	): string {
		return toHex(hashSync(algorithm, data));
	}

	function md5Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('md5', data);
	}

	function sha1Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('sha1', data);
	}

	function sha256Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('sha256', data);
	}

	function sha384Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('sha384', data);
	}

	function sha512Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('sha512', data);
	}

	function sha3_256Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('sha3-256', data);
	}

	function sha3_512Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('sha3-512', data);
	}

	function blake2b256Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('blake2b256', data);
	}

	function blake2s256Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('blake2s256', data);
	}

	function blake3Sync(data: string | Uint8Array): Uint8Array {
		return hashSync('blake3', data);
	}

	function hmacSync(
		algorithm: HmacAlgorithm,
		key: string | Uint8Array,
		data: string | Uint8Array,
	): Uint8Array {
		const { exports, memory } = getSyncState();
		return hmacImpl(exports, memory, algorithm, toBytes(key), toBytes(data));
	}

	function hmacHexSync(
		algorithm: HmacAlgorithm,
		key: string | Uint8Array,
		data: string | Uint8Array,
	): string {
		return toHex(hmacSync(algorithm, key, data));
	}

	function hmacSha256Sync(
		key: string | Uint8Array,
		data: string | Uint8Array,
	): Uint8Array {
		return hmacSync('sha256', key, data);
	}

	function hmacSha512Sync(
		key: string | Uint8Array,
		data: string | Uint8Array,
	): Uint8Array {
		return hmacSync('sha512', key, data);
	}

	function getHashDigestLengthSync(algorithm: HashAlgorithm): number {
		const { exports } = getSyncState();
		return getDigestLength(exports, algorithm);
	}

	// ============================================================================
	// Return Instance
	// ============================================================================

	return {
		// Lifecycle
		init,
		isInitialized,
		dispose,

		// Async API
		hash,
		hashHex,
		md5,
		sha1,
		sha256,
		sha384,
		sha512,
		sha3_256,
		sha3_512,
		blake2b256,
		blake2s256,
		blake3,
		hmac,
		hmacHex,
		hmacSha256,
		hmacSha512,
		getHashDigestLength,

		// Sync API
		hashSync,
		hashHexSync,
		md5Sync,
		sha1Sync,
		sha256Sync,
		sha384Sync,
		sha512Sync,
		sha3_256Sync,
		sha3_512Sync,
		blake2b256Sync,
		blake2s256Sync,
		blake3Sync,
		hmacSync,
		hmacHexSync,
		hmacSha256Sync,
		hmacSha512Sync,
		getHashDigestLengthSync,
	};
}

// ============================================================================
// Default Singleton Instance
// ============================================================================

const _defaultInstance = createCrypto();

// ============================================================================
// Re-export all methods for backwards compatibility
// ============================================================================

// Lifecycle
export const init = _defaultInstance.init;
export const isInitialized = _defaultInstance.isInitialized;
export const dispose = _defaultInstance.dispose;

// Async API
export const hash = _defaultInstance.hash;
export const hashHex = _defaultInstance.hashHex;
export const md5 = _defaultInstance.md5;
export const sha1 = _defaultInstance.sha1;
export const sha256 = _defaultInstance.sha256;
export const sha384 = _defaultInstance.sha384;
export const sha512 = _defaultInstance.sha512;
export const sha3_256 = _defaultInstance.sha3_256;
export const sha3_512 = _defaultInstance.sha3_512;
export const blake2b256 = _defaultInstance.blake2b256;
export const blake2s256 = _defaultInstance.blake2s256;
export const blake3 = _defaultInstance.blake3;
export const hmac = _defaultInstance.hmac;
export const hmacHex = _defaultInstance.hmacHex;
export const hmacSha256 = _defaultInstance.hmacSha256;
export const hmacSha512 = _defaultInstance.hmacSha512;
export const getHashDigestLength = _defaultInstance.getHashDigestLength;

// Sync API
export const hashSync = _defaultInstance.hashSync;
export const hashHexSync = _defaultInstance.hashHexSync;
export const md5Sync = _defaultInstance.md5Sync;
export const sha1Sync = _defaultInstance.sha1Sync;
export const sha256Sync = _defaultInstance.sha256Sync;
export const sha384Sync = _defaultInstance.sha384Sync;
export const sha512Sync = _defaultInstance.sha512Sync;
export const sha3_256Sync = _defaultInstance.sha3_256Sync;
export const sha3_512Sync = _defaultInstance.sha3_512Sync;
export const blake2b256Sync = _defaultInstance.blake2b256Sync;
export const blake2s256Sync = _defaultInstance.blake2s256Sync;
export const blake3Sync = _defaultInstance.blake3Sync;
export const hmacSync = _defaultInstance.hmacSync;
export const hmacHexSync = _defaultInstance.hmacHexSync;
export const hmacSha256Sync = _defaultInstance.hmacSha256Sync;
export const hmacSha512Sync = _defaultInstance.hmacSha512Sync;
export const getHashDigestLengthSync = _defaultInstance.getHashDigestLengthSync;
