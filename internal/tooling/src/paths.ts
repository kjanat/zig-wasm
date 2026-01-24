import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

/**
 * Resolve the absolute path to a package.json given a monorepo root and a
 * package identifier (scoped name, short name, or relative path).
 *
 * @param pkgPath - Package identifier (@scope/name, short name, or ./relative/path)
 * @param monorepoRoot - Absolute path to the monorepo root
 * @returns Absolute path to the package.json file
 *
 * @example
 * ```ts
 * // Scoped package name
 * resolvePackageJsonPath("@zig-wasm/crypto", "/path/to/monorepo");
 * // => "/path/to/monorepo/packages/crypto/package.json"
 *
 * // Short name
 * resolvePackageJsonPath("crypto", "/path/to/monorepo");
 * // => "/path/to/monorepo/packages/crypto/package.json"
 *
 * // Relative path
 * resolvePackageJsonPath("./packages/crypto", "/path/to/monorepo");
 * // => "/path/to/monorepo/packages/crypto/package.json"
 * ```
 */
export function resolvePackageJsonPath(
	pkgPath: string,
	monorepoRoot: string,
): string {
	if (pkgPath.startsWith('@')) {
		const segments = pkgPath.split('/');
		const pkgDir =
			segments[segments.length - 1] || segments[segments.length - 2] || pkgPath;
		return resolve(monorepoRoot, 'packages', pkgDir, 'package.json');
	}

	if (pkgPath.startsWith('.')) {
		return resolve(monorepoRoot, pkgPath, 'package.json');
	}

	return resolve(monorepoRoot, 'packages', pkgPath, 'package.json');
}

/**
 * Read and parse a package.json file.
 *
 * @param packageJsonPath - Absolute path to the package.json file
 * @returns Parsed package.json contents with name and version guaranteed
 * @throws Error if file doesn't exist, isn't valid JSON, or missing required fields
 *
 * @example
 * ```ts
 * const pkg = await readPackageJson("/path/to/package.json");
 * console.log(`${pkg.name}@${pkg.version}`);
 * ```
 */
export async function readPackageJson(
	packageJsonPath: string,
): Promise<{ name: string; version: string; [key: string]: unknown }> {
	try {
		const content = await readFile(packageJsonPath, 'utf-8');
		const parsed = JSON.parse(content) as Record<string, unknown>;

		if (typeof parsed.name !== 'string' || !parsed.name) {
			throw new Error(
				`Invalid package.json at ${packageJsonPath}: missing or invalid "name" field`,
			);
		}

		if (typeof parsed.version !== 'string' || !parsed.version) {
			throw new Error(
				`Invalid package.json at ${packageJsonPath}: missing or invalid "version" field`,
			);
		}

		return parsed as { name: string; version: string; [key: string]: unknown };
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			throw new Error(`Package not found: ${packageJsonPath}`);
		}
		throw error;
	}
}

/**
 * Extract the directory name from a path.
 * Uses path.basename for cross-platform compatibility.
 *
 * @param dir - Directory path
 * @returns The final component of the path
 */
export function getDirName(dir: string): string {
	return basename(dir) || dir;
}
