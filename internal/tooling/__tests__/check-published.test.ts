import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	checkPublished,
	checkPublishedCli,
	findMonorepoRoot,
} from '@zig-wasm/tooling';
import { runCli } from '../src/cli.ts';

// Helper to create a temp workspace with package
function createTempWorkspace(
	pkgName: string,
	version: string,
): { dir: string; pkgDir: string } {
	const dir = fs.mkdtempSync(join(tmpdir(), 'check-published-'));
	fs.writeFileSync(
		join(dir, 'pnpm-workspace.yaml'),
		'packages:\n  - packages/*\n',
	);

	// Strip any @scope/ prefix to get the directory name
	const shortName = pkgName.includes('/') ? pkgName.split('/')[1]! : pkgName;
	const pkgDir = join(dir, 'packages', shortName);
	fs.mkdirSync(pkgDir, { recursive: true });
	fs.writeFileSync(
		join(pkgDir, 'package.json'),
		JSON.stringify({ name: pkgName, version }, null, 2),
	);

	return { dir, pkgDir };
}

describe('checkPublished', () => {
	let consoleLogSpy: ReturnType<typeof spyOn>;
	let consoleErrorSpy: ReturnType<typeof spyOn>;
	let consoleWarnSpy: ReturnType<typeof spyOn>;
	let originalArgv: string[];
	let originalFetch: typeof fetch;

	beforeEach(() => {
		originalArgv = process.argv;
		consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
		consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
		consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {});
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		process.argv = originalArgv;
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		consoleWarnSpy.mockRestore();
		globalThis.fetch = originalFetch;
	});

	describe('monorepo root detection', () => {
		it('throws when pnpm-workspace.yaml is missing', () => {
			const tmp = fs.mkdtempSync(join(tmpdir(), 'monorepo-root-missing-'));
			try {
				expect(() => findMonorepoRoot(tmp)).toThrow(
					'Could not find pnpm-workspace.yaml. Run this script from within the monorepo.',
				);
			} finally {
				fs.rmSync(tmp, { recursive: true, force: true });
			}
		});

		it('finds workspace when marker exists in start dir', () => {
			const tmp = fs.mkdtempSync(join(tmpdir(), 'monorepo-root-found-'));
			try {
				fs.writeFileSync(join(tmp, 'pnpm-workspace.yaml'), 'packages: []');
				expect(findMonorepoRoot(tmp)).toBe(tmp);
			} finally {
				fs.rmSync(tmp, { recursive: true, force: true });
			}
		});

		it('walks up to find pnpm-workspace.yaml', () => {
			const workspaceRoot = fs.mkdtempSync(join(tmpdir(), 'check-published-'));
			const nestedCwd = join(workspaceRoot, 'nested', 'child');
			fs.mkdirSync(nestedCwd, { recursive: true });
			fs.writeFileSync(
				join(workspaceRoot, 'pnpm-workspace.yaml'),
				'packages: []',
			);

			try {
				expect(findMonorepoRoot(nestedCwd)).toBe(workspaceRoot);
			} finally {
				fs.rmSync(workspaceRoot, { recursive: true, force: true });
			}
		});
	});

	describe('npm registry checks', () => {
		it('detects published packages', async () => {
			const { dir, pkgDir } = createTempWorkspace('@zig-wasm/std', '0.1.0');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () =>
				new Response(null, { status: 200 });

			try {
				const result = await checkPublished('std');
				expect(result.published).toBe(true);
				expect(result.name).toBe('@zig-wasm/std');
				expect(result.version).toBe('0.1.0');
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('detects unpublished packages', async () => {
			const { dir } = createTempWorkspace('@zig-wasm/math', '99.99.99');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () =>
				new Response(null, { status: 404 });

			try {
				const result = await checkPublished('math');
				expect(result.published).toBe(false);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});
	});

	describe('path resolution', () => {
		it('resolves scoped package names', async () => {
			const { dir } = createTempWorkspace('@zig-wasm/crypto', '0.0.1');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () =>
				new Response(null, { status: 404 });

			try {
				const result = await checkPublished('@zig-wasm/crypto');
				expect(result.name).toBe('@zig-wasm/crypto');
				expect(result.version).toBe('0.0.1');
				expect(result.published).toBe(false);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('resolves package names without scope', async () => {
			const { dir } = createTempWorkspace('@zig-wasm/hash', '0.1.0');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () =>
				new Response(null, { status: 200 });

			try {
				const result = await checkPublished('hash');
				expect(result.name).toBe('@zig-wasm/hash');
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('resolves relative paths', async () => {
			const { dir } = createTempWorkspace('@zig-wasm/base64', '1.2.3');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () =>
				new Response(null, { status: 200 });

			try {
				const result = await checkPublished('./packages/base64');
				expect(result.name).toBe('@zig-wasm/base64');
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});
	});

	describe('result structure', () => {
		it('returns correct result structure', async () => {
			const { dir } = createTempWorkspace('@test/package', '1.0.0');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () =>
				new Response(null, { status: 200 });

			try {
				const result = await checkPublished('package');
				expect(result).toHaveProperty('name');
				expect(result).toHaveProperty('version');
				expect(result).toHaveProperty('published');
				expect(typeof result.name).toBe('string');
				expect(typeof result.version).toBe('string');
				expect(typeof result.published).toBe('boolean');
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});
	});

	describe('error handling', () => {
		it('handles network errors', async () => {
			const { dir } = createTempWorkspace('@test/pkg', '1.0.0');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () => {
				throw new Error('Network error');
			};

			try {
				await expect(checkPublished('pkg')).rejects.toThrow('Network error');
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('handles timeout (AbortError)', async () => {
			const { dir } = createTempWorkspace('@test/pkg', '1.0.0');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () => {
				const err = new Error('The operation was aborted');
				err.name = 'AbortError';
				throw err;
			};

			try {
				await expect(checkPublished('pkg')).rejects.toThrow(
					'Request timed out',
				);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('throws on HTTP error status from registry', async () => {
			const { dir } = createTempWorkspace('@test/pkg', '1.0.0');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			(globalThis as any).fetch = async () =>
				new Response(null, { status: 500 });

			try {
				await expect(checkPublished('pkg')).rejects.toThrow(
					'Registry returned HTTP 500',
				);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('throws on missing package.json', async () => {
			const dir = fs.mkdtempSync(join(tmpdir(), 'check-published-'));
			fs.writeFileSync(
				join(dir, 'pnpm-workspace.yaml'),
				'packages:\n  - packages/*\n',
			);
			fs.mkdirSync(join(dir, 'packages/nonexistent'), { recursive: true });
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			try {
				await expect(checkPublished('nonexistent')).rejects.toThrow(
					'Package not found',
				);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('throws on malformed package.json', async () => {
			const dir = fs.mkdtempSync(join(tmpdir(), 'check-published-'));
			fs.writeFileSync(
				join(dir, 'pnpm-workspace.yaml'),
				'packages:\n  - packages/*\n',
			);
			const pkgDir = join(dir, 'packages/malformed');
			fs.mkdirSync(pkgDir, { recursive: true });
			fs.writeFileSync(
				join(pkgDir, 'package.json'),
				JSON.stringify({ invalid: true }),
			);
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			try {
				await expect(checkPublished('malformed')).rejects.toThrow(
					/missing or invalid "name" field/,
				);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('throws on package.json with missing version field', async () => {
			const dir = fs.mkdtempSync(join(tmpdir(), 'check-published-'));
			fs.writeFileSync(
				join(dir, 'pnpm-workspace.yaml'),
				'packages:\n  - packages/*\n',
			);
			const pkgDir = join(dir, 'packages/noversion');
			fs.mkdirSync(pkgDir, { recursive: true });
			fs.writeFileSync(
				join(pkgDir, 'package.json'),
				JSON.stringify({ name: '@test/pkg' }),
			);
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			try {
				await expect(checkPublished('noversion')).rejects.toThrow(
					/missing or invalid "version" field/,
				);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});
	});

	describe('edge cases', () => {
		it('handles version with pre-release tags', async () => {
			const { dir } = createTempWorkspace('@test/pkg', '1.0.0-beta.1');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);

			let fetchedUrl = '';
			(globalThis as any).fetch = async (url: any) => {
				fetchedUrl = String(url);
				return new Response(null, { status: 200 });
			};

			try {
				const result = await checkPublished('pkg');
				expect(result.version).toBe('1.0.0-beta.1');
				expect(fetchedUrl).toContain('1.0.0-beta.1');
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});
	});

	describe('CLI handler (checkPublishedCli)', () => {
		it('returns 0 when --help is provided', async () => {
			process.argv = ['node', 'check-published.ts', '--help'];
			const exitCode = await checkPublishedCli();
			expect(exitCode).toBe(0);
		});

		it('returns 0 when -h is provided', async () => {
			process.argv = ['node', 'check-published.ts', '-h'];
			const exitCode = await checkPublishedCli();
			expect(exitCode).toBe(0);
		});

		it('returns 2 when no arguments provided', async () => {
			process.argv = ['node', 'check-published.ts'];
			const exitCode = await checkPublishedCli();
			expect(exitCode).toBe(2);
		});

		it('returns 0 for published package', async () => {
			const { dir } = createTempWorkspace('@zig-wasm/core', '1.0.0');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);
			(globalThis as any).fetch = async () =>
				new Response(null, { status: 200 });

			process.argv = ['node', 'check-published.ts', 'core'];

			try {
				const exitCode = await checkPublishedCli();
				expect(exitCode).toBe(0);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});

		it('returns 1 for unpublished package', async () => {
			const { dir } = createTempWorkspace('@zig-wasm/core', '99.99.99');
			const cwdSpy = spyOn(process, 'cwd').mockReturnValue(dir);
			(globalThis as any).fetch = async () =>
				new Response(null, { status: 404 });

			process.argv = ['node', 'check-published.ts', 'core'];

			try {
				const exitCode = await checkPublishedCli();
				expect(exitCode).toBe(1);
			} finally {
				cwdSpy.mockRestore();
				fs.rmSync(dir, { recursive: true, force: true });
			}
		});
	});
});

describe('runCli', () => {
	let consoleErrorSpy: ReturnType<typeof spyOn>;
	let originalExitCode: typeof process.exitCode;

	beforeEach(() => {
		consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
		originalExitCode = process.exitCode;
		process.exitCode = undefined;
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
		process.exitCode = originalExitCode;
	});

	it('sets process.exitCode to returned value on success', async () => {
		await runCli(async () => 0);
		expect(process.exitCode).toBe(0);

		await runCli(async () => 1);
		expect(process.exitCode).toBe(1);
	});

	it('sets process.exitCode to 2 and logs error on exception', async () => {
		const testError = new Error('Test failure');

		await runCli(async () => {
			throw testError;
		});

		expect(process.exitCode).toBe(2);
		expect(consoleErrorSpy).toHaveBeenCalledWith(testError);
	});
});
