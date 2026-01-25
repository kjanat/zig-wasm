/**
 * Tests for module initialization, lifecycle, and error handling
 */

import { beforeEach, describe, expect, it } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NotInitializedError } from '@zig-wasm/core';
import { createMath, type MathInstance } from '@zig-wasm/math';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, '../wasm/math.wasm');

describe('Module Initialization', () => {
	let math: MathInstance;

	beforeEach(() => {
		math = createMath();
	});

	describe('isInitialized', () => {
		it('returns false before init', () => {
			expect(math.isInitialized()).toBe(false);
		});

		it('returns true after init completes', async () => {
			await math.init();
			expect(math.isInitialized()).toBe(true);
		});
	});

	describe('getExports and getExportsAsync', () => {
		it('getExportsAsync returns WASM exports after init', async () => {
			const exports = await math.getExportsAsync();

			expect(exports).toBeDefined();
			expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
			expect(exports.abs_f64).toBeTypeOf('function');
			expect(exports.sin_f64).toBeTypeOf('function');
		});

		it('getExports returns WASM exports after init', async () => {
			await math.init();

			const exports = math.getExports();

			expect(exports).toBeDefined();
			expect(exports.memory).toBeInstanceOf(WebAssembly.Memory);
			expect(exports.abs_f64).toBeTypeOf('function');
		});

		it('getExports throws when not initialized', () => {
			expect(() => math.getExports()).toThrow('not initialized');
		});
	});

	describe('init idempotency', () => {
		it('multiple init calls return immediately', async () => {
			// First init
			await math.init();
			const exports1 = math.getExports();

			// Second init should be a no-op
			await math.init();
			const exports2 = math.getExports();

			expect(exports1).toBe(exports2);
		});

		it('handles concurrent init calls safely', async () => {
			// Start multiple inits concurrently
			const promises = [math.init(), math.init(), math.init()];

			await Promise.all(promises);

			expect(math.isInitialized()).toBe(true);
			// All should resolve to the same exports
			const exports = math.getExports();
			expect(exports.abs_f64).toBeTypeOf('function');
		});
	});

	describe('async API auto-initialization', () => {
		it('async functions auto-initialize on first call', async () => {
			expect(math.isInitialized()).toBe(false);

			// Call should auto-initialize
			const result = await math.abs(-42);
			expect(result).toBe(42);
			expect(math.isInitialized()).toBe(true);
		});

		it('multiple async calls trigger single initialization', async () => {
			// Multiple concurrent async calls
			const results = await Promise.all([
				math.abs(-1),
				math.abs(-2),
				math.abs(-3),
			]);

			expect(results).toEqual([1, 2, 3]);
			expect(math.isInitialized()).toBe(true);
		});
	});

	describe('dispose and re-initialization', () => {
		it('dispose resets initialization state', async () => {
			await math.init();
			expect(math.isInitialized()).toBe(true);

			math.dispose();
			expect(math.isInitialized()).toBe(false);
		});

		it('can re-initialize after dispose', async () => {
			await math.init();
			const firstResult = math.absSync(-5);

			math.dispose();
			expect(() => math.absSync(-5)).toThrow('not initialized');

			await math.init();
			const secondResult = math.absSync(-5);

			expect(firstResult).toBe(5);
			expect(secondResult).toBe(5);
		});
	});
});

describe('NotInitializedError behavior', () => {
	it('NotInitializedError has correct format', () => {
		const error = new NotInitializedError('math');

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('NotInitializedError');
		expect(error.message).toContain('math');
		expect(error.message).toContain('not initialized');
		expect(error.message).toContain('init()');
	});

	it('getExports throws NotInitializedError when not initialized', () => {
		const math = createMath();

		expect(() => math.getExports()).toThrow('not initialized');
	});
});

describe('Sync API coverage', () => {
	let math: MathInstance;

	beforeEach(async () => {
		math = createMath();
		await math.init();
	});

	it('absSync works', () => {
		expect(math.absSync(-42)).toBe(42);
		expect(math.absSync(42)).toBe(42);
	});

	it('minSync works', () => {
		expect(math.minSync(5, 10)).toBe(5);
		expect(math.minSync(-5, -10)).toBe(-10);
	});

	it('maxSync works', () => {
		expect(math.maxSync(5, 10)).toBe(10);
		expect(math.maxSync(-5, -10)).toBe(-5);
	});

	it('clampSync works', () => {
		expect(math.clampSync(5, 0, 10)).toBe(5);
		expect(math.clampSync(-5, 0, 10)).toBe(0);
		expect(math.clampSync(15, 0, 10)).toBe(10);
	});

	it('sqrtSync works', () => {
		expect(math.sqrtSync(16)).toBe(4);
		expect(math.sqrtSync(2)).toBeCloseTo(Math.SQRT2, 10);
	});

	it('sinSync and cosSync work', () => {
		const pi = math.piSync();
		expect(math.sinSync(0)).toBeCloseTo(0, 5);
		expect(math.sinSync(pi / 2)).toBeCloseTo(1, 5);
		expect(math.cosSync(0)).toBeCloseTo(1, 5);
		expect(math.cosSync(pi)).toBeCloseTo(-1, 5);
	});

	it('piSync returns correct value', () => {
		expect(math.piSync()).toBeCloseTo(Math.PI, 10);
	});
});

describe('Sync API without init', () => {
	it('throws NotInitializedError when calling sync API before init', () => {
		const math = createMath();

		expect(() => math.absSync(5)).toThrow('not initialized');
		expect(() => math.getExports()).toThrow('not initialized');
	});
});

describe('Init options coverage', () => {
	it('accepts wasmBytes option', async () => {
		const { readFile } = await import('node:fs/promises');
		const wasmBytes = await readFile(wasmPath);
		const math = createMath();

		await math.init({ wasmBytes });

		expect(math.isInitialized()).toBe(true);
		expect(math.absSync(-5)).toBe(5);
	});

	it('accepts wasmPath option', async () => {
		const math = createMath();

		await math.init({ wasmPath });

		expect(math.isInitialized()).toBe(true);
		expect(math.absSync(-5)).toBe(5);
	});

	it('accepts wasmUrl with custom fetchFn', async () => {
		const { pathToFileURL } = await import('node:url');
		const math = createMath();

		const wasmUrl = pathToFileURL(wasmPath).href;

		await math.init({
			wasmUrl,
			fetchFn: async (url) => {
				// Convert file:// URL back to path and read using Bun's API
				const filePath = fileURLToPath(url);
				return Bun.file(filePath).arrayBuffer();
			},
		});

		expect(math.isInitialized()).toBe(true);
		expect(math.absSync(-5)).toBe(5);
	});
});

describe('Concurrent init with fresh module', () => {
	it('second caller awaits first init promise', async () => {
		const math = createMath();

		// Both start before wasmExports is set - tests the initPromise branch
		const p1 = math.init();
		const p2 = math.init();

		await Promise.all([p1, p2]);

		expect(math.isInitialized()).toBe(true);
		expect(math.absSync(-42)).toBe(42);
	});
});

describe('Instance isolation', () => {
	it('multiple instances are independent', async () => {
		const math1 = createMath();
		const math2 = createMath();

		await math1.init();

		expect(math1.isInitialized()).toBe(true);
		expect(math2.isInitialized()).toBe(false);

		await math2.init();

		expect(math1.isInitialized()).toBe(true);
		expect(math2.isInitialized()).toBe(true);

		// Dispose one doesn't affect the other
		math1.dispose();

		expect(math1.isInitialized()).toBe(false);
		expect(math2.isInitialized()).toBe(true);
	});

	it('each instance has its own exports', async () => {
		const math1 = createMath();
		const math2 = createMath();

		await math1.init();
		await math2.init();

		const exports1 = math1.getExports();
		const exports2 = math2.getExports();

		// Different WASM instances
		expect(exports1).not.toBe(exports2);

		// But both work correctly
		expect(exports1.abs_f64(-5)).toBe(5);
		expect(exports2.abs_f64(-10)).toBe(10);
	});
});
