/**
 * Tests for initialization paths and error handling in @zig-wasm/hash.
 *
 * Uses the factory pattern (createHasher) for proper test isolation.
 * Each test gets a fresh hasher instance via beforeEach.
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NotInitializedError } from '@zig-wasm/core';
import { createHasher, type Hasher } from '@zig-wasm/hash';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, '../wasm/hash.wasm');

describe('Initialization Paths', () => {
	let hasher: Hasher;

	beforeEach(() => {
		hasher = createHasher();
	});

	afterEach(() => {
		hasher.dispose();
	});

	describe('wasmBytes initialization', () => {
		it('initializes with wasmBytes', async () => {
			const wasmBytes = new Uint8Array(readFileSync(wasmPath));

			await hasher.init({ wasmBytes });

			expect(hasher.isInitialized()).toBe(true);
			const result = hasher.crc32Sync('test');
			expect(typeof result).toBe('number');
		});

		it('supports imports option with wasmBytes', async () => {
			const wasmBytes = new Uint8Array(readFileSync(wasmPath));

			await hasher.init({
				wasmBytes,
				imports: {}, // empty imports object
			});

			expect(hasher.isInitialized()).toBe(true);
		});
	});

	describe('wasmUrl initialization', () => {
		it('initializes with wasmUrl and custom fetchFn', async () => {
			const wasmUrl = pathToFileURL(wasmPath).href;

			await hasher.init({
				wasmUrl,
				fetchFn: async (url) => {
					// Use Bun's native file API for reliable reads
					const filePath = fileURLToPath(url);
					return Bun.file(filePath).arrayBuffer();
				},
			});

			expect(hasher.isInitialized()).toBe(true);
			const result = hasher.crc32Sync('test');
			expect(typeof result).toBe('number');
		});
	});

	describe('wasmPath initialization', () => {
		it('initializes with wasmPath', async () => {
			await hasher.init({ wasmPath });

			expect(hasher.isInitialized()).toBe(true);
			const result = hasher.crc32Sync('test');
			expect(typeof result).toBe('number');
		});
	});
});

describe('Concurrent initialization', () => {
	let hasher: Hasher;

	beforeEach(() => {
		hasher = createHasher();
	});

	afterEach(() => {
		hasher.dispose();
	});

	it('reuses initPromise for concurrent init calls', async () => {
		// Start multiple init calls simultaneously
		const promise1 = hasher.init({ wasmPath });
		const promise2 = hasher.init({ wasmPath });
		const promise3 = hasher.init({ wasmPath });

		// All should resolve to the same initialization
		await Promise.all([promise1, promise2, promise3]);

		expect(hasher.isInitialized()).toBe(true);

		// Verify functional after concurrent init
		const result = hasher.crc32Sync('concurrent test');
		expect(typeof result).toBe('number');
	});

	it('handles init called while initialization is in progress', async () => {
		// First call starts initialization
		const firstInit = hasher.init({ wasmPath });

		// Second call should reuse the pending promise
		const secondInit = hasher.init({ wasmPath });

		await firstInit;
		await secondInit;

		expect(hasher.isInitialized()).toBe(true);
	});
});

describe('NotInitializedError', () => {
	let hasher: Hasher;

	beforeEach(() => {
		hasher = createHasher();
	});

	afterEach(() => {
		hasher.dispose();
	});

	// Helper to check error name matches imported class
	const expectNotInitializedError = (fn: () => void) => {
		try {
			fn();
			throw new Error('Should have thrown');
		} catch (error) {
			expect((error as Error).name).toBe(NotInitializedError.name);
		}
	};

	it('throws NotInitializedError when sync functions called before init', () => {
		expect(hasher.isInitialized()).toBe(false);
		expectNotInitializedError(() => hasher.crc32Sync('test'));
	});

	it('throws with correct module name in error', () => {
		try {
			hasher.crc32Sync('test');
			throw new Error('Should have thrown');
		} catch (error) {
			expect((error as Error).name).toBe(NotInitializedError.name);
			expect((error as Error).message).toContain('hash');
		}
	});

	it('throws for all sync functions before init', () => {
		// 32-bit sync functions
		expectNotInitializedError(() => hasher.hash32Sync('crc32', 'test'));
		expectNotInitializedError(() => hasher.adler32Sync('test'));
		expectNotInitializedError(() => hasher.xxhash32Sync('test'));
		expectNotInitializedError(() => hasher.fnv1a32Sync('test'));

		// 64-bit sync functions
		expectNotInitializedError(() => hasher.hash64Sync('xxhash64', 'test'));
		expectNotInitializedError(() => hasher.xxhash64Sync('test'));
		expectNotInitializedError(() => hasher.wyhashSync('test'));
		expectNotInitializedError(() => hasher.cityhash64Sync('test'));
		expectNotInitializedError(() => hasher.murmur2_64Sync('test'));
		expectNotInitializedError(() => hasher.fnv1a64Sync('test'));

		// Generic sync functions
		expectNotInitializedError(() => hasher.hashSync('crc32', 'test'));
		expectNotInitializedError(() => hasher.hashHexSync('crc32', 'test'));
	});

	it('throws for hex sync functions before init', () => {
		expectNotInitializedError(() => hasher.crc32HexSync('test'));
		expectNotInitializedError(() => hasher.adler32HexSync('test'));
		expectNotInitializedError(() => hasher.xxhash32HexSync('test'));
		expectNotInitializedError(() => hasher.xxhash64HexSync('test'));
		expectNotInitializedError(() => hasher.wyhashHexSync('test'));
		expectNotInitializedError(() => hasher.cityhash64HexSync('test'));
		expectNotInitializedError(() => hasher.murmur2_64HexSync('test'));
		expectNotInitializedError(() => hasher.fnv1a32HexSync('test'));
		expectNotInitializedError(() => hasher.fnv1a64HexSync('test'));
	});
});

describe('Idempotent initialization', () => {
	let hasher: Hasher;

	beforeEach(() => {
		hasher = createHasher();
	});

	afterEach(() => {
		hasher.dispose();
	});

	it('returns immediately if already initialized', async () => {
		// First initialization
		await hasher.init({ wasmPath });
		expect(hasher.isInitialized()).toBe(true);

		// Second call should return immediately
		await hasher.init({ wasmPath });
		expect(hasher.isInitialized()).toBe(true);

		// Should still work
		const result = hasher.crc32Sync('idempotent');
		expect(typeof result).toBe('number');
	});
});

describe('Factory isolation', () => {
	it('creates independent instances', async () => {
		const hasher1 = createHasher();
		const hasher2 = createHasher();

		// Initialize only hasher1
		await hasher1.init({ wasmPath });

		expect(hasher1.isInitialized()).toBe(true);
		expect(hasher2.isInitialized()).toBe(false);

		// hasher1 works, hasher2 throws
		expect(typeof hasher1.crc32Sync('test')).toBe('number');
		expect(() => hasher2.crc32Sync('test')).toThrow('not initialized');

		hasher1.dispose();
		hasher2.dispose();
	});

	it('dispose allows re-initialization', async () => {
		const hasher = createHasher();

		await hasher.init({ wasmPath });
		expect(hasher.isInitialized()).toBe(true);

		hasher.dispose();
		expect(hasher.isInitialized()).toBe(false);

		// Can re-initialize
		await hasher.init({ wasmPath });
		expect(hasher.isInitialized()).toBe(true);
		expect(typeof hasher.crc32Sync('test')).toBe('number');

		hasher.dispose();
	});
});

describe('Hash function correctness', () => {
	let hasher: Hasher;

	beforeEach(async () => {
		hasher = createHasher();
		await hasher.init({ wasmPath });
	});

	afterEach(() => {
		hasher.dispose();
	});

	it('computes correct CRC32 values', () => {
		const result = hasher.crc32Sync('Hello, World!');
		// CRC32 returns unsigned 32-bit, JavaScript may show as signed
		// Use >>> 0 to compare as unsigned
		expect(result >>> 0).toBe(3964322768);
	});

	it('computes correct hex output', () => {
		const result = hasher.crc32HexSync('test');
		expect(result).toBe('d87f7e0c');
	});

	it('handles Uint8Array input', () => {
		const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
		const result = hasher.crc32Sync(data);
		expect(typeof result).toBe('number');
		// CRC32 may be negative due to signed 32-bit representation
		expect(result >>> 0 !== 0).toBe(true);
	});

	it('64-bit functions return bigint', () => {
		const result = hasher.xxhash64Sync('test');
		expect(typeof result).toBe('bigint');
	});

	it('seeded functions accept seeds', () => {
		const unseeded = hasher.xxhash32Sync('test');
		const seeded = hasher.xxhash32Sync('test', 42);
		expect(unseeded).not.toBe(seeded);

		const unseeded64 = hasher.xxhash64Sync('test');
		const seeded64 = hasher.xxhash64Sync('test', 42n);
		expect(unseeded64).not.toBe(seeded64);
	});
});
