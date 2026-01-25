import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncVersions } from '@zig-wasm/tooling';

// Helper to create a temp workspace
function createTempWorkspace(): string {
	const dir = fs.mkdtempSync(join(tmpdir(), 'sync-versions-'));
	fs.writeFileSync(
		join(dir, 'pnpm-workspace.yaml'),
		'packages:\n  - packages/*\n  - internal/*\n',
	);
	fs.mkdirSync(join(dir, 'packages'), { recursive: true });
	fs.mkdirSync(join(dir, 'internal'), { recursive: true });
	return dir;
}

// Helper to create a package in the workspace
function createPackage(
	workspaceDir: string,
	location: string,
	name: string,
	pkgVersion: string,
	jsrVersion: string,
) {
	// Strip any @scope/ prefix to get the directory name
	const shortName = name.includes('/') ? name.split('/')[1] : name;
	const pkgDir = join(workspaceDir, location, shortName!);
	fs.mkdirSync(pkgDir, { recursive: true });
	fs.writeFileSync(
		join(pkgDir, 'package.json'),
		JSON.stringify({ name, version: pkgVersion }, null, 2) + '\n',
	);
	fs.writeFileSync(
		join(pkgDir, 'jsr.json'),
		JSON.stringify({ name, version: jsrVersion }, null, 2) + '\n',
	);
}

// Helper to run CLI commands
function runCli(
	args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
	return new Promise((resolve) => {
		const script = join(import.meta.dirname, '../src/sync-versions.ts');
		const proc = spawn('npx', ['-y', 'tsx', script, ...args], {
			cwd: join(import.meta.dirname, '../../..'),
		});

		let stdout = '';
		let stderr = '';

		proc.stdout.on('data', (data) => {
			stdout += data.toString();
		});
		proc.stderr.on('data', (data) => {
			stderr += data.toString();
		});
		proc.on('close', (code) => {
			resolve({ code: code ?? 1, stdout, stderr });
		});
	});
}

describe('syncVersions', () => {
	let workspaceDir: string;
	let consoleLogSpy: ReturnType<typeof spyOn>;
	let consoleWarnSpy: ReturnType<typeof spyOn>;
	let consoleErrorSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		workspaceDir = createTempWorkspace();
		consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
		consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {});
		consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		fs.rmSync(workspaceDir, { recursive: true, force: true });
		consoleLogSpy.mockRestore();
		consoleWarnSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe('version synchronization', () => {
		it('syncs mismatched versions from package.json to jsr.json', async () => {
			createPackage(
				workspaceDir,
				'packages',
				'@zig-wasm/core',
				'0.2.0',
				'0.1.0',
			);
			createPackage(
				workspaceDir,
				'packages',
				'@zig-wasm/crypto',
				'1.0.0',
				'1.0.0',
			);

			const result = await syncVersions({ cwd: workspaceDir });

			expect(result.mismatches).toBe(1);
			expect(result.synced).toEqual(['@zig-wasm/core']);
			expect(result.success).toBe(true);

			const jsrContent = JSON.parse(
				fs.readFileSync(join(workspaceDir, 'packages/core/jsr.json'), 'utf-8'),
			);
			expect(jsrContent.version).toBe('0.2.0');
		});

		it('reports mismatches in check-only mode without modifying files', async () => {
			createPackage(
				workspaceDir,
				'packages',
				'@zig-wasm/math',
				'2.0.0',
				'1.5.0',
			);

			const result = await syncVersions({ cwd: workspaceDir, checkOnly: true });

			expect(result.mismatches).toBe(1);
			expect(result.synced).toEqual([]);
			expect(result.success).toBe(false);

			const jsrContent = JSON.parse(
				fs.readFileSync(join(workspaceDir, 'packages/math/jsr.json'), 'utf-8'),
			);
			expect(jsrContent.version).toBe('1.5.0');
		});

		it('returns success when all versions are in sync', async () => {
			createPackage(
				workspaceDir,
				'packages',
				'@zig-wasm/hash',
				'1.0.0',
				'1.0.0',
			);
			createPackage(
				workspaceDir,
				'packages',
				'@zig-wasm/compress',
				'0.5.0',
				'0.5.0',
			);

			const result = await syncVersions({ cwd: workspaceDir });

			expect(result.mismatches).toBe(0);
			expect(result.synced).toEqual([]);
			expect(result.success).toBe(true);
		});
	});

	describe('directory scanning', () => {
		it('scans both packages and internal directories', async () => {
			createPackage(
				workspaceDir,
				'packages',
				'@zig-wasm/core',
				'1.0.0',
				'0.9.0',
			);
			createPackage(
				workspaceDir,
				'internal',
				'@zig-wasm/tooling',
				'2.0.0',
				'1.0.0',
			);

			const result = await syncVersions({ cwd: workspaceDir });

			expect(result.mismatches).toBe(2);
			expect(result.synced).toHaveLength(2);
			expect(result.synced).toContain('@zig-wasm/core');
			expect(result.synced).toContain('@zig-wasm/tooling');
		});

		it('skips directories without both package.json and jsr.json', async () => {
			createPackage(
				workspaceDir,
				'packages',
				'@test/with-both',
				'1.0.0',
				'1.0.0',
			);

			const pkgOnlyDir = join(workspaceDir, 'packages/package-only');
			fs.mkdirSync(pkgOnlyDir, { recursive: true });
			fs.writeFileSync(
				join(pkgOnlyDir, 'package.json'),
				JSON.stringify({ name: '@test/pkg-only', version: '1.0.0' }),
			);

			const jsrOnlyDir = join(workspaceDir, 'packages/jsr-only');
			fs.mkdirSync(jsrOnlyDir, { recursive: true });
			fs.writeFileSync(
				join(jsrOnlyDir, 'jsr.json'),
				JSON.stringify({ name: '@test/jsr-only', version: '1.0.0' }),
			);

			const result = await syncVersions({ cwd: workspaceDir });

			expect(result.mismatches).toBe(0);
			expect(result.synced).toEqual([]);
		});
	});

	describe('result structure', () => {
		it('returns correct result structure', async () => {
			const result = await syncVersions({ cwd: workspaceDir });

			expect(result).toHaveProperty('success');
			expect(result).toHaveProperty('mismatches');
			expect(result).toHaveProperty('synced');
			expect(typeof result.success).toBe('boolean');
			expect(typeof result.mismatches).toBe('number');
			expect(Array.isArray(result.synced)).toBe(true);
		});

		it('tracks all synced packages', async () => {
			for (let i = 1; i <= 3; i++) {
				createPackage(
					workspaceDir,
					'packages',
					`@test/pkg${i}`,
					'2.0.0',
					'1.0.0',
				);
			}

			const result = await syncVersions({ cwd: workspaceDir });

			expect(result.mismatches).toBe(3);
			expect(result.synced).toHaveLength(3);
			expect(result.success).toBe(true);
		});
	});

	describe('version formatting', () => {
		it('preserves version format when syncing', async () => {
			const pkgDir = join(workspaceDir, 'packages/versioned');
			fs.mkdirSync(pkgDir, { recursive: true });
			fs.writeFileSync(
				join(pkgDir, 'package.json'),
				JSON.stringify(
					{ name: '@test/versioned', version: '1.2.3-beta.4+build.5' },
					null,
					2,
				) + '\n',
			);
			fs.writeFileSync(
				join(pkgDir, 'jsr.json'),
				JSON.stringify(
					{ name: '@test/versioned', version: '1.0.0', other: 'field' },
					null,
					2,
				) + '\n',
			);

			await syncVersions({ cwd: workspaceDir });

			const jsrContent = JSON.parse(
				fs.readFileSync(join(pkgDir, 'jsr.json'), 'utf-8'),
			);
			expect(jsrContent.version).toBe('1.2.3-beta.4+build.5');
			expect(jsrContent.other).toBe('field');
		});

		it('maintains JSON formatting with proper indentation', async () => {
			const pkgDir = join(workspaceDir, 'packages/formatted');
			fs.mkdirSync(pkgDir, { recursive: true });
			fs.writeFileSync(
				join(pkgDir, 'package.json'),
				JSON.stringify({ name: '@test/formatted', version: '2.0.0' }, null, 2) +
					'\n',
			);
			fs.writeFileSync(
				join(pkgDir, 'jsr.json'),
				JSON.stringify(
					{ name: '@test/formatted', version: '1.0.0', exports: './index.ts' },
					null,
					2,
				) + '\n',
			);

			await syncVersions({ cwd: workspaceDir });

			const written = fs.readFileSync(join(pkgDir, 'jsr.json'), 'utf-8');
			expect(written).toContain('  ');
			expect(written).toMatch(/\n$/);
			expect(JSON.parse(written)).toEqual({
				name: '@test/formatted',
				version: '2.0.0',
				exports: './index.ts',
			});
		});
	});

	describe.skipIf(process.version.startsWith('v20'))('CLI entry point', () => {
		it('exits with code 0 when all versions are in sync', async () => {
			const result = await runCli([]);
			expect([0, 1]).toContain(result.code);
			const output = result.stdout || result.stderr;
			expect(output).toContain('Syncing package versions');
		}, 30000);

		it('handles --check flag', async () => {
			const result = await runCli(['--check']);
			expect([0, 1]).toContain(result.code);
			const output = result.stdout || result.stderr;
			expect(output).toContain('Syncing package versions');
		}, 30000);

		it('outputs sync status for packages', async () => {
			const result = await runCli([]);
			const output = result.stdout || result.stderr;
			expect(output).toMatch(/@zig-wasm\//);
		}, 30000);
	});
});
