/**
 * Tests for base64 module initialization, lifecycle, and sync API error handling
 */

import { beforeEach, describe, expect, it } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Base64Instance } from '@zig-wasm/base64';
import { createBase64, NotInitializedError } from '@zig-wasm/base64';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(__dirname, '../wasm/base64.wasm');

describe('Concurrent Initialization', () => {
	let base64: Base64Instance;

	beforeEach(() => {
		base64 = createBase64();
	});

	it('handles concurrent init calls safely', async () => {
		// Start multiple inits concurrently
		const promises = [base64.init(), base64.init(), base64.init()];

		await Promise.all(promises);

		expect(base64.isInitialized()).toBe(true);
		// All should resolve without error
		const result = base64.encodeSync('test');
		expect(result).toBe('dGVzdA==');
	});

	it('multiple async operations trigger single initialization', async () => {
		// Multiple concurrent async calls
		const results = await Promise.all([
			base64.encode('a'),
			base64.encode('b'),
			base64.encode('c'),
		]);

		expect(results).toEqual(['YQ==', 'Yg==', 'Yw==']);
		expect(base64.isInitialized()).toBe(true);
	});
});

describe('NotInitializedError behavior', () => {
	it('NotInitializedError has correct format', () => {
		const error = new NotInitializedError('base64');

		expect(error).toBeInstanceOf(Error);
		expect(error.name).toBe('NotInitializedError');
		expect(error.message).toContain('base64');
		expect(error.message).toContain('not initialized');
		expect(error.message).toContain('init()');
	});
});

describe('Sync decode variants', () => {
	let base64: Base64Instance;

	beforeEach(async () => {
		base64 = createBase64();
		await base64.init();
	});

	it('decodeSync works correctly', () => {
		const result = base64.decodeSync('aGVsbG8=');
		expect(new TextDecoder().decode(result)).toBe('hello');
	});

	it('async decode works correctly', async () => {
		const result = await base64.decode('aGVsbG8=');
		expect(new TextDecoder().decode(result)).toBe('hello');
	});

	it('decodeNoPaddingSync works correctly', () => {
		const result = base64.decodeNoPaddingSync('YWJj');
		expect(new TextDecoder().decode(result)).toBe('abc');
	});

	it('decodeUrlSync works correctly', () => {
		const result = base64.decodeUrlSync('dGVzdA==');
		expect(new TextDecoder().decode(result)).toBe('test');
	});

	it('decodeUrlNoPaddingSync works correctly', () => {
		const result = base64.decodeUrlNoPaddingSync('dGVzdA');
		expect(new TextDecoder().decode(result)).toBe('test');
	});
});

describe('Init options coverage', () => {
	it('accepts wasmBytes option', async () => {
		const wasmBytes = await readFile(wasmPath);
		const base64 = createBase64();

		await base64.init({ wasmBytes });

		expect(base64.isInitialized()).toBe(true);
		expect(base64.encodeSync('test')).toBe('dGVzdA==');
	});

	it('accepts wasmPath option', async () => {
		const base64 = createBase64();

		await base64.init({ wasmPath });

		expect(base64.isInitialized()).toBe(true);
		expect(base64.encodeSync('test')).toBe('dGVzdA==');
	});

	it('accepts wasmUrl with custom fetchFn', async () => {
		const base64 = createBase64();

		const wasmUrl = pathToFileURL(wasmPath).href;

		await base64.init({
			wasmUrl,
			fetchFn: async (url) => {
				// Use Bun's native file API for reliable reads
				const filePath = fileURLToPath(url);
				return Bun.file(filePath).arrayBuffer();
			},
		});

		expect(base64.isInitialized()).toBe(true);
		expect(base64.encodeSync('test')).toBe('dGVzdA==');
	});
});

describe('Sync API without init', () => {
	it('throws NotInitializedError when calling sync API before init', () => {
		const base64 = createBase64();

		expect(() => base64.encodeSync('test')).toThrow('not initialized');
		expect(() => base64.decodeSync('dGVzdA==')).toThrow('not initialized');
	});
});

describe('Concurrent init with fresh module', () => {
	it('second caller awaits first init promise', async () => {
		const base64 = createBase64();

		const p1 = base64.init();
		const p2 = base64.init();

		await Promise.all([p1, p2]);

		expect(base64.isInitialized()).toBe(true);
		expect(base64.encodeSync('test')).toBe('dGVzdA==');
	});
});

describe('Additional sync encode coverage', () => {
	let base64: Base64Instance;

	beforeEach(async () => {
		base64 = createBase64();
		await base64.init();
	});

	it('encodeSync with Uint8Array input', () => {
		const bytes = new Uint8Array([0, 1, 2, 255, 254, 253]);
		const result = base64.encodeSync(bytes);
		expect(result).toBe('AAEC//79');
	});

	it('encodeNoPaddingSync with Uint8Array input', () => {
		const result = base64.encodeNoPaddingSync(new Uint8Array([1, 2]));
		expect(result).not.toContain('=');
		expect(result).toMatch(/^[A-Za-z0-9+/]+$/);
	});

	it('encodeUrlSync with Uint8Array input', () => {
		// Bytes that produce + or / in standard base64
		const bytes = new Uint8Array([251, 239, 255]);
		const result = base64.encodeUrlSync(bytes);
		expect(result).not.toMatch(/[+/]/);
		expect(result).toMatch(/^[A-Za-z0-9_-]+[=]*$/);
	});

	it('encodeUrlNoPaddingSync with Uint8Array input', () => {
		const bytes = new Uint8Array([251, 239]);
		const result = base64.encodeUrlNoPaddingSync(bytes);
		expect(result).not.toContain('=');
		expect(result).not.toMatch(/[+/]/);
	});

	it('hexEncodeSync with Uint8Array input', () => {
		const bytes = new Uint8Array([0, 15, 255, 128]);
		const result = base64.hexEncodeSync(bytes);
		expect(result).toBe('000fff80');
	});
});

describe('Dispose and reinitialize', () => {
	it('dispose resets the instance state', async () => {
		const base64 = createBase64();
		await base64.init();

		expect(base64.isInitialized()).toBe(true);

		base64.dispose();

		expect(base64.isInitialized()).toBe(false);
		expect(() => base64.encodeSync('test')).toThrow('not initialized');
	});

	it('can reinitialize after dispose', async () => {
		const base64 = createBase64();
		await base64.init();
		base64.dispose();

		await base64.init();

		expect(base64.isInitialized()).toBe(true);
		expect(base64.encodeSync('test')).toBe('dGVzdA==');
	});

	it('can reinitialize with different options after dispose', async () => {
		const base64 = createBase64();
		await base64.init();
		base64.dispose();

		const wasmBytes = await readFile(wasmPath);
		await base64.init({ wasmBytes });

		expect(base64.isInitialized()).toBe(true);
		expect(base64.encodeSync('test')).toBe('dGVzdA==');
	});
});

describe('Multiple independent instances', () => {
	it('instances are independent', async () => {
		const instance1 = createBase64();
		const instance2 = createBase64();

		await instance1.init();

		expect(instance1.isInitialized()).toBe(true);
		expect(instance2.isInitialized()).toBe(false);

		await instance2.init();

		expect(instance1.isInitialized()).toBe(true);
		expect(instance2.isInitialized()).toBe(true);

		// Dispose one doesn't affect the other
		instance1.dispose();

		expect(instance1.isInitialized()).toBe(false);
		expect(instance2.isInitialized()).toBe(true);

		// Both should still work correctly
		expect(() => instance1.encodeSync('test')).toThrow('not initialized');
		expect(instance2.encodeSync('test')).toBe('dGVzdA==');
	});

	it('concurrent operations on different instances', async () => {
		const instance1 = createBase64();
		const instance2 = createBase64();

		const [result1, result2] = await Promise.all([
			instance1.encode('hello'),
			instance2.encode('world'),
		]);

		expect(result1).toBe('aGVsbG8=');
		expect(result2).toBe('d29ybGQ=');
		expect(instance1.isInitialized()).toBe(true);
		expect(instance2.isInitialized()).toBe(true);
	});
});
