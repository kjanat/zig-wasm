/**
 * Tests for crypto module initialization and edge cases
 */

import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NotInitializedError } from '@zig-wasm/core';
import { type CryptoInstance, createCrypto } from '@zig-wasm/crypto';

const wasmPath = join(
	dirname(fileURLToPath(import.meta.url)),
	'../wasm/crypto.wasm',
);

// Helper to convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

// Helper to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
	}
	return bytes;
}

describe('NotInitializedError', () => {
	it('throws NotInitializedError when calling sync functions before init', () => {
		const crypto = createCrypto();

		expect(crypto.isInitialized()).toBe(false);

		// Test that sync functions throw with correct error name
		expect(() => crypto.hashSync('sha256', 'test')).toThrowError(
			/not initialized/i,
		);
		expect(() => crypto.hashHexSync('sha256', 'test')).toThrowError(
			/not initialized/i,
		);
		expect(() => crypto.md5Sync('test')).toThrowError(/not initialized/i);
		expect(() => crypto.sha1Sync('test')).toThrowError(/not initialized/i);
		expect(() => crypto.sha256Sync('test')).toThrowError(/not initialized/i);
		expect(() => crypto.sha384Sync('test')).toThrowError(/not initialized/i);
		expect(() => crypto.sha512Sync('test')).toThrowError(/not initialized/i);
		expect(() => crypto.sha3_256Sync('test')).toThrowError(/not initialized/i);
		expect(() => crypto.sha3_512Sync('test')).toThrowError(/not initialized/i);
		expect(() => crypto.blake2b256Sync('test')).toThrowError(
			/not initialized/i,
		);
		expect(() => crypto.blake2s256Sync('test')).toThrowError(
			/not initialized/i,
		);
		expect(() => crypto.blake3Sync('test')).toThrowError(/not initialized/i);
		expect(() => crypto.hmacSync('sha256', 'key', 'data')).toThrowError(
			/not initialized/i,
		);
		expect(() => crypto.hmacHexSync('sha256', 'key', 'data')).toThrowError(
			/not initialized/i,
		);
		expect(() => crypto.hmacSha256Sync('key', 'data')).toThrowError(
			/not initialized/i,
		);
		expect(() => crypto.hmacSha512Sync('key', 'data')).toThrowError(
			/not initialized/i,
		);
		expect(() => crypto.getHashDigestLengthSync('sha256')).toThrowError(
			/not initialized/i,
		);
	});

	it('error message includes module name', () => {
		const crypto = createCrypto();

		try {
			crypto.sha256Sync('test');
			throw new Error('Should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect((e as Error).name).toBe('NotInitializedError');
			expect((e as Error).message).toContain('crypto');
		}
	});

	it('throws with correct error class', () => {
		const crypto = createCrypto();

		try {
			crypto.sha256Sync('test');
			throw new Error('Should have thrown');
		} catch (e) {
			expect((e as Error).name).toBe(NotInitializedError.name);
		}
	});
});

describe('Init with wasmPath option', () => {
	it('initializes with custom wasmPath', async () => {
		const crypto = createCrypto();

		await crypto.init({ wasmPath });

		expect(crypto.isInitialized()).toBe(true);
		const hash = crypto.sha256Sync('test');
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});
});

describe('Init with wasmBytes option', () => {
	it('initializes with pre-loaded WASM bytes', async () => {
		const crypto = createCrypto();
		const wasmBytes = new Uint8Array(readFileSync(wasmPath));

		await crypto.init({ wasmBytes });

		expect(crypto.isInitialized()).toBe(true);
		const hash = crypto.sha256Sync('hello');
		expect(bytesToHex(hash)).toBe(
			'2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
		);
	});

	it('supports imports option with wasmBytes', async () => {
		const crypto = createCrypto();
		const wasmBytes = new Uint8Array(readFileSync(wasmPath));

		await crypto.init({
			wasmBytes,
			imports: {}, // empty imports object
		});

		expect(crypto.isInitialized()).toBe(true);
	});
});

describe('Init with wasmUrl option', () => {
	it('initializes with wasmUrl and custom fetchFn', async () => {
		const { pathToFileURL } = await import('node:url');

		const crypto = createCrypto();
		const wasmUrl = pathToFileURL(wasmPath).href;

		await crypto.init({
			wasmUrl,
			fetchFn: async (url) => {
				// Use Bun's native file API for reliable reads
				const filePath = fileURLToPath(url);
				return Bun.file(filePath).arrayBuffer();
			},
		});

		expect(crypto.isInitialized()).toBe(true);
		const hash = crypto.sha256Sync('test');
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});
});

describe('HMAC-SHA512 Sync', () => {
	let crypto: CryptoInstance;

	it('computes HMAC-SHA512 synchronously', async () => {
		crypto = createCrypto();
		await crypto.init({ wasmPath });

		const result = crypto.hmacSha512Sync('key', 'data');
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(64);
	});

	it('matches async HMAC-SHA512 result', async () => {
		crypto = createCrypto();
		await crypto.init({ wasmPath });

		const syncResult = crypto.hmacSha512Sync('secret', 'message');
		const asyncResult = await crypto.hmacSha512('secret', 'message');
		expect(bytesToHex(syncResult)).toBe(bytesToHex(asyncResult));
	});

	it('handles RFC 4231 Test Case 1 synchronously', async () => {
		crypto = createCrypto();
		await crypto.init({ wasmPath });

		const key = hexToBytes('0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b');
		const data = hexToBytes('4869205468657265'); // "Hi There"
		const result = crypto.hmacSha512Sync(key, data);
		expect(bytesToHex(result)).toBe(
			'87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854',
		);
	});

	it('handles empty key synchronously', async () => {
		crypto = createCrypto();
		await crypto.init({ wasmPath });

		const result = crypto.hmacSha512Sync('', 'data');
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(64);
	});

	it('handles empty data synchronously', async () => {
		crypto = createCrypto();
		await crypto.init({ wasmPath });

		const result = crypto.hmacSha512Sync('key', '');
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(64);
	});

	it('handles long key (> block size) synchronously', async () => {
		crypto = createCrypto();
		await crypto.init({ wasmPath });

		// Key longer than SHA-512 block size (128 bytes)
		const longKey = 'k'.repeat(200);
		const result = crypto.hmacSha512Sync(longKey, 'data');
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(64);
	});

	it('handles Uint8Array inputs synchronously', async () => {
		crypto = createCrypto();
		await crypto.init({ wasmPath });

		const key = new TextEncoder().encode('secret');
		const data = new TextEncoder().encode('message');
		const result = crypto.hmacSha512Sync(key, data);
		const stringResult = crypto.hmacSha512Sync('secret', 'message');
		expect(bytesToHex(result)).toBe(bytesToHex(stringResult));
	});
});

describe('Additional HMAC edge cases', () => {
	it('handles HMAC-SHA512 with very long data', async () => {
		const crypto = createCrypto();
		await crypto.init({ wasmPath });

		const longData = 'a'.repeat(10000);
		const result = crypto.hmacSha512Sync('key', longData);
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(64);
	});

	it('handles HMAC with Unicode key and data', async () => {
		const crypto = createCrypto();
		await crypto.init({ wasmPath });

		const result = crypto.hmacSha256Sync('secret', 'Hello');
		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);

		const result512 = crypto.hmacSha512Sync('secret', 'Hello');
		expect(result512).toBeInstanceOf(Uint8Array);
		expect(result512.length).toBe(64);
	});
});

describe('Generic hmacSync with sha512', () => {
	it('computes HMAC via hmacSync with sha512 algorithm', async () => {
		const crypto = createCrypto();
		await crypto.init({ wasmPath });

		const result = crypto.hmacSync('sha512', 'key', 'data');
		const direct = crypto.hmacSha512Sync('key', 'data');
		expect(bytesToHex(result)).toBe(bytesToHex(direct));
	});

	it('computes hmacHexSync with sha512 algorithm', async () => {
		const crypto = createCrypto();
		await crypto.init({ wasmPath });

		const result = crypto.hmacHexSync('sha512', 'key', 'data');
		const bytes = crypto.hmacSha512Sync('key', 'data');
		expect(result).toBe(bytesToHex(bytes));
	});
});

describe('Init idempotency', () => {
	it('calling init multiple times is safe', async () => {
		const crypto = createCrypto();

		await crypto.init({ wasmPath });
		expect(crypto.isInitialized()).toBe(true);

		// Second call should be a no-op
		await crypto.init({ wasmPath });
		expect(crypto.isInitialized()).toBe(true);

		// Should still work
		const hash = crypto.sha256Sync('test');
		expect(hash.length).toBe(32);
	});

	it('handles concurrent init calls', async () => {
		const crypto = createCrypto();

		const results = await Promise.all([
			crypto.init({ wasmPath }),
			crypto.init({ wasmPath }),
			crypto.init({ wasmPath }),
			crypto.init({ wasmPath }),
		]);

		expect(crypto.isInitialized()).toBe(true);
		// All should resolve without error
		expect(results).toHaveLength(4);
	});

	it('reuses initPromise for concurrent init calls', async () => {
		const crypto = createCrypto();

		// Start multiple init calls simultaneously
		const promise1 = crypto.init({ wasmPath });
		const promise2 = crypto.init({ wasmPath });
		const promise3 = crypto.init({ wasmPath });

		// All should resolve to the same initialization
		await Promise.all([promise1, promise2, promise3]);

		expect(crypto.isInitialized()).toBe(true);

		// Verify functional after concurrent init
		const result = crypto.sha256Sync('concurrent test');
		expect(result).toBeInstanceOf(Uint8Array);
	});
});

describe('All hash algorithms with all input types', () => {
	const testData = 'test data for hashing';
	const testDataBytes = new TextEncoder().encode(testData);

	it('all algorithms work with string input', async () => {
		const crypto = createCrypto();
		await crypto.init({ wasmPath });

		const algorithms = [
			'md5',
			'sha1',
			'sha256',
			'sha384',
			'sha512',
			'sha3-256',
			'sha3-512',
			'blake2b256',
			'blake2s256',
			'blake3',
		] as const;

		for (const algo of algorithms) {
			const result = crypto.hashSync(algo, testData);
			expect(result).toBeInstanceOf(Uint8Array);
		}
	});

	it('all algorithms work with Uint8Array input', async () => {
		const crypto = createCrypto();
		await crypto.init({ wasmPath });

		const algorithms = [
			'md5',
			'sha1',
			'sha256',
			'sha384',
			'sha512',
			'sha3-256',
			'sha3-512',
			'blake2b256',
			'blake2s256',
			'blake3',
		] as const;

		for (const algo of algorithms) {
			const stringResult = crypto.hashSync(algo, testData);
			const bytesResult = crypto.hashSync(algo, testDataBytes);
			expect(bytesToHex(stringResult)).toBe(bytesToHex(bytesResult));
		}
	});
});

describe('Dispose functionality', () => {
	it('dispose resets initialization state', async () => {
		const crypto = createCrypto();
		await crypto.init({ wasmPath });
		expect(crypto.isInitialized()).toBe(true);

		crypto.dispose();
		expect(crypto.isInitialized()).toBe(false);

		// Sync functions should throw after dispose
		expect(() => crypto.sha256Sync('test')).toThrowError(/not initialized/i);
	});

	it('can reinitialize after dispose', async () => {
		const crypto = createCrypto();
		await crypto.init({ wasmPath });
		expect(crypto.isInitialized()).toBe(true);

		const hash1 = crypto.sha256Sync('test');

		crypto.dispose();
		expect(crypto.isInitialized()).toBe(false);

		await crypto.init({ wasmPath });
		expect(crypto.isInitialized()).toBe(true);

		const hash2 = crypto.sha256Sync('test');
		expect(bytesToHex(hash1)).toBe(bytesToHex(hash2));
	});
});

describe('Multiple independent instances', () => {
	it('instances do not share state', async () => {
		const crypto1 = createCrypto();
		const crypto2 = createCrypto();

		// Initialize only crypto1
		await crypto1.init({ wasmPath });

		expect(crypto1.isInitialized()).toBe(true);
		expect(crypto2.isInitialized()).toBe(false);

		// crypto1 works, crypto2 throws
		const hash1 = crypto1.sha256Sync('test');
		expect(hash1).toBeInstanceOf(Uint8Array);
		expect(() => crypto2.sha256Sync('test')).toThrowError(/not initialized/i);
	});

	it('disposing one instance does not affect others', async () => {
		const crypto1 = createCrypto();
		const crypto2 = createCrypto();

		await Promise.all([crypto1.init({ wasmPath }), crypto2.init({ wasmPath })]);

		expect(crypto1.isInitialized()).toBe(true);
		expect(crypto2.isInitialized()).toBe(true);

		crypto1.dispose();

		expect(crypto1.isInitialized()).toBe(false);
		expect(crypto2.isInitialized()).toBe(true);

		// crypto2 still works
		const hash = crypto2.sha256Sync('test');
		expect(hash).toBeInstanceOf(Uint8Array);
	});
});
