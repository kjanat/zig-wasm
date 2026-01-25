import { beforeEach, describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	type Compressor,
	createCompressor,
	decompressLzma,
	decompressXz,
	NotInitializedError,
} from '@zig-wasm/compress';

const fixturesDir = join(import.meta.dirname, 'fixtures');
const currentDir = dirname(fileURLToPath(import.meta.url));
const wasmPath = join(currentDir, '../wasm/compress.wasm');

function loadFixture(filename: string): Uint8Array {
	return new Uint8Array(readFileSync(join(fixturesDir, filename)));
}

describe('NotInitializedError', () => {
	let compressor: Compressor;

	beforeEach(() => {
		compressor = createCompressor();
	});

	it('throws NotInitializedError when calling sync function before init', () => {
		expect(compressor.isInitialized()).toBe(false);
		expect(() =>
			compressor.decompressXzSync(new Uint8Array([1, 2, 3])),
		).toThrow(NotInitializedError);
	});

	it('throws NotInitializedError for decompressLzmaSync before init', () => {
		expect(compressor.isInitialized()).toBe(false);
		expect(() =>
			compressor.decompressLzmaSync(new Uint8Array([1, 2, 3])),
		).toThrow(NotInitializedError);
	});

	it('NotInitializedError has descriptive message', () => {
		try {
			compressor.decompressXzSync(new Uint8Array([1, 2, 3]));
			throw new Error('Should have thrown');
		} catch (err) {
			expect(err).toBeInstanceOf(NotInitializedError);
			expect((err as Error).message).toContain('compress');
		}
	});
});

describe('init() options', () => {
	let compressor: Compressor;

	beforeEach(() => {
		compressor = createCompressor();
	});

	it('supports wasmPath option', async () => {
		expect(compressor.isInitialized()).toBe(false);
		await compressor.init({ wasmPath });
		expect(compressor.isInitialized()).toBe(true);

		const compressed = loadFixture('hello.txt.xz');
		const result = compressor.decompressXzSync(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
	});

	it('supports wasmBytes option', async () => {
		const wasmBytes = new Uint8Array(readFileSync(wasmPath));

		expect(compressor.isInitialized()).toBe(false);
		await compressor.init({ wasmBytes });
		expect(compressor.isInitialized()).toBe(true);

		const compressed = loadFixture('hello.txt.xz');
		const result = compressor.decompressXzSync(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
	});

	it('supports wasmUrl with custom fetchFn', async () => {
		const { pathToFileURL } = await import('node:url');

		const wasmUrl = pathToFileURL(wasmPath).href;

		expect(compressor.isInitialized()).toBe(false);
		await compressor.init({
			wasmUrl,
			fetchFn: async (url) => {
				// Use Bun's native file API for reliable reads
				const filePath = fileURLToPath(url);
				return Bun.file(filePath).arrayBuffer();
			},
		});
		expect(compressor.isInitialized()).toBe(true);

		const compressed = loadFixture('hello.txt.xz');
		const result = compressor.decompressXzSync(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
	});

	it('init is idempotent - second call is a no-op', async () => {
		await compressor.init({ wasmPath });
		expect(compressor.isInitialized()).toBe(true);

		// Second init with different options should be ignored
		await compressor.init({ wasmPath: '/nonexistent/path.wasm' });
		expect(compressor.isInitialized()).toBe(true);

		// Should still work
		const compressed = loadFixture('hello.txt.xz');
		const result = compressor.decompressXzSync(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
	});

	it('handles concurrent init calls safely', async () => {
		expect(compressor.isInitialized()).toBe(false);

		// Start multiple init calls concurrently
		const promises = [
			compressor.init({ wasmPath }),
			compressor.init({ wasmPath }),
			compressor.init({ wasmPath }),
		];

		await Promise.all(promises);
		expect(compressor.isInitialized()).toBe(true);

		// Module should work correctly
		const compressed = loadFixture('hello.txt.xz');
		const result = compressor.decompressXzSync(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
	});

	it('init returns on concurrent call while first is in progress', async () => {
		expect(compressor.isInitialized()).toBe(false);

		// Start first init
		const first = compressor.init({ wasmPath });

		// Immediately start second - should join the same promise
		const second = compressor.init({ wasmPath });

		// Both should resolve
		await Promise.all([first, second]);
		expect(compressor.isInitialized()).toBe(true);
	});
});

describe('init() with default path (Node/Bun)', () => {
	let compressor: Compressor;

	beforeEach(() => {
		compressor = createCompressor();
	});

	it('auto-detects environment and loads WASM', async () => {
		expect(compressor.isInitialized()).toBe(false);

		// Call init without options - should auto-detect Node/Bun environment
		await compressor.init();
		expect(compressor.isInitialized()).toBe(true);

		const compressed = loadFixture('hello.txt.xz');
		const result = compressor.decompressXzSync(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
	});
});

describe('Error recovery after init failure attempt', () => {
	let compressor: Compressor;

	beforeEach(() => {
		compressor = createCompressor();
	});

	it('recovers when init fails with invalid wasmPath', async () => {
		expect(compressor.isInitialized()).toBe(false);

		// Attempt init with invalid path - should throw
		await expect(
			compressor.init({ wasmPath: '/nonexistent/invalid.wasm' }),
		).rejects.toThrow();

		// After failed init, create fresh instance
		const freshCompressor = createCompressor();
		expect(freshCompressor.isInitialized()).toBe(false);

		// Async API should auto-init correctly
		const compressed = loadFixture('hello.txt.xz');
		const result = await freshCompressor.decompressXz(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
		expect(freshCompressor.isInitialized()).toBe(true);
	});
});

describe('Edge cases for decompression', () => {
	it('handles truncated XZ data', async () => {
		// Take valid XZ file and truncate it
		const valid = loadFixture('hello.txt.xz');
		const truncated = valid.slice(0, Math.floor(valid.length / 2));

		await expect(decompressXz(truncated)).rejects.toThrow(
			'XZ decompression failed',
		);
	});

	it('handles truncated LZMA data', async () => {
		// Take valid LZMA file and truncate it
		const valid = loadFixture('hello.txt.lzma');
		const truncated = valid.slice(0, Math.floor(valid.length / 2));

		await expect(decompressLzma(truncated)).rejects.toThrow(
			'LZMA decompression failed',
		);
	});

	it('handles XZ with corrupted middle bytes', async () => {
		const valid = loadFixture('text.txt.xz');
		const corrupted = new Uint8Array(valid);
		// Corrupt bytes in the middle
		for (let i = 20; i < 40 && i < corrupted.length; i++) {
			corrupted[i] = corrupted[i]! ^ 0xff;
		}

		await expect(decompressXz(corrupted)).rejects.toThrow(
			'XZ decompression failed',
		);
	});

	it('handles LZMA with corrupted middle bytes', async () => {
		const valid = loadFixture('text.txt.lzma');
		const corrupted = new Uint8Array(valid);
		// Corrupt bytes in the middle
		for (let i = 20; i < 40 && i < corrupted.length; i++) {
			corrupted[i] = corrupted[i]! ^ 0xff;
		}

		await expect(decompressLzma(corrupted)).rejects.toThrow(
			'LZMA decompression failed',
		);
	});

	it('handles single byte input (too small for valid header)', async () => {
		const tiny = new Uint8Array([0x00]);

		await expect(decompressXz(tiny)).rejects.toThrow('XZ decompression failed');
		await expect(decompressLzma(tiny)).rejects.toThrow(
			'LZMA decompression failed',
		);
	});

	it('handles XZ magic bytes but no content', async () => {
		// XZ magic: FD 37 7A 58 5A 00
		const xzMagicOnly = new Uint8Array([0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00]);

		await expect(decompressXz(xzMagicOnly)).rejects.toThrow(
			'XZ decompression failed',
		);
	});
});

describe('Sync API after async init', () => {
	let compressor: Compressor;

	beforeEach(() => {
		compressor = createCompressor();
	});

	it('sync functions work after async function auto-initializes', async () => {
		expect(compressor.isInitialized()).toBe(false);

		// Call async first - triggers auto-init
		const compressedXz = loadFixture('hello.txt.xz');
		await compressor.decompressXz(compressedXz);

		expect(compressor.isInitialized()).toBe(true);

		// Now sync should work
		const resultXz = compressor.decompressXzSync(compressedXz);
		expect(new TextDecoder().decode(resultXz)).toBe('Hello, World!');

		const compressedLzma = loadFixture('hello.txt.lzma');
		const resultLzma = compressor.decompressLzmaSync(compressedLzma);
		expect(new TextDecoder().decode(resultLzma)).toBe('Hello, World!');
	});
});

describe('dispose()', () => {
	it('resets instance state allowing re-initialization', async () => {
		const compressor = createCompressor();

		await compressor.init({ wasmPath });
		expect(compressor.isInitialized()).toBe(true);

		compressor.dispose();
		expect(compressor.isInitialized()).toBe(false);

		// Should be able to re-initialize
		await compressor.init({ wasmPath });
		expect(compressor.isInitialized()).toBe(true);

		const compressed = loadFixture('hello.txt.xz');
		const result = compressor.decompressXzSync(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
	});

	it('throws NotInitializedError after dispose', async () => {
		const compressor = createCompressor();

		await compressor.init({ wasmPath });
		compressor.dispose();

		expect(() =>
			compressor.decompressXzSync(new Uint8Array([1, 2, 3])),
		).toThrow(NotInitializedError);
	});
});

describe('Factory creates independent instances', () => {
	it('instances have independent state', async () => {
		const compressor1 = createCompressor();
		const compressor2 = createCompressor();

		expect(compressor1.isInitialized()).toBe(false);
		expect(compressor2.isInitialized()).toBe(false);

		await compressor1.init({ wasmPath });

		expect(compressor1.isInitialized()).toBe(true);
		expect(compressor2.isInitialized()).toBe(false);

		await compressor2.init({ wasmPath });

		expect(compressor1.isInitialized()).toBe(true);
		expect(compressor2.isInitialized()).toBe(true);

		// Dispose one, other should still work
		compressor1.dispose();

		expect(compressor1.isInitialized()).toBe(false);
		expect(compressor2.isInitialized()).toBe(true);

		const compressed = loadFixture('hello.txt.xz');
		const result = compressor2.decompressXzSync(compressed);
		expect(new TextDecoder().decode(result)).toBe('Hello, World!');
	});
});
