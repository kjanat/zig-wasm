#!/usr/bin/env bun
/**
 * Syncs versions across package.json and jsr.json files in the monorepo.
 *
 * Usage:
 *   bun scripts/sync-versions.ts [version]
 *
 * If version is provided, bumps all packages to that version.
 * If no version, syncs jsr.json files to match their package.json versions.
 *
 * Examples:
 *   bun scripts/sync-versions.ts          # Sync jsr.json to package.json
 *   bun scripts/sync-versions.ts 0.2.0    # Bump all to 0.2.0
 *   bun scripts/sync-versions.ts patch    # Bump patch version
 *   bun scripts/sync-versions.ts minor    # Bump minor version
 *   bun scripts/sync-versions.ts major    # Bump major version
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageJson {
	name: string;
	version: string;
	dependencies?: Record<string, string>;
}

interface JsrJson {
	name: string;
	version: string;
	imports?: Record<string, string>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

// Find all packages with jsr.json
function findPackages(): string[] {
	const packages: string[] = [];

	const searchDirs = ['packages', 'internal'];
	for (const dir of searchDirs) {
		const searchPath = join(ROOT, dir);
		if (!existsSync(searchPath)) continue;

		const result = execSync(`find ${searchPath} -maxdepth 2 -name jsr.json`, {
			encoding: 'utf-8',
		});

		for (const line of result.trim().split('\n')) {
			if (line) packages.push(dirname(line));
		}
	}

	return packages;
}

// Read package.json
function readPackageJson(pkgDir: string): PackageJson {
	const pkgPath = join(pkgDir, 'package.json');
	return JSON.parse(readFileSync(pkgPath, 'utf-8'));
}

// Read jsr.json
function readJsrJson(pkgDir: string): JsrJson {
	const jsrPath = join(pkgDir, 'jsr.json');
	return JSON.parse(readFileSync(jsrPath, 'utf-8'));
}

// Write package.json
function writePackageJson(pkgDir: string, pkg: PackageJson): void {
	const pkgPath = join(pkgDir, 'package.json');
	writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

// Write jsr.json
function writeJsrJson(pkgDir: string, jsr: JsrJson): void {
	const jsrPath = join(pkgDir, 'jsr.json');
	writeFileSync(jsrPath, JSON.stringify(jsr, null, 2) + '\n');
}

// Parse semver
function parseSemver(version: string): [number, number, number] {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
	if (!match) throw new Error(`Invalid semver: ${version}`);
	return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

// Bump version
function bumpVersion(
	current: string,
	type: 'major' | 'minor' | 'patch',
): string {
	const [major, minor, patch] = parseSemver(current);
	switch (type) {
		case 'major':
			return `${major + 1}.0.0`;
		case 'minor':
			return `${major}.${minor + 1}.0`;
		case 'patch':
			return `${major}.${minor}.${patch + 1}`;
	}
}

// Convert version to JSR import specifier
function toJsrSpecifier(name: string, version: string): string {
	const jsrVersion = version.startsWith('^') ? version : `^${version}`;
	return `jsr:${name}@${jsrVersion}`;
}

// Get all @zig-wasm package versions
function getPackageVersions(packages: string[]): Map<string, string> {
	const versions = new Map<string, string>();
	for (const pkgDir of packages) {
		const pkg = readPackageJson(pkgDir);
		versions.set(pkg.name, pkg.version);
	}
	return versions;
}

// Sync a single package
function syncPackage(
	pkgDir: string,
	newVersion: string | null,
	allVersions: Map<string, string>,
): void {
	const relPath = relative(ROOT, pkgDir);
	const pkg = readPackageJson(pkgDir);
	const jsr = readJsrJson(pkgDir);

	const version = newVersion ?? pkg.version;
	let changed = false;

	// Update package.json version if bumping
	if (newVersion && pkg.version !== newVersion) {
		pkg.version = newVersion;
		writePackageJson(pkgDir, pkg);
		console.log(`  ${relPath}/package.json -> ${newVersion}`);
		changed = true;
	}

	// Update jsr.json version
	if (jsr.version !== version) {
		jsr.version = version;
		changed = true;
	}

	// Update jsr.json imports to use new versions
	if (jsr.imports) {
		for (const [depName, specifier] of Object.entries(jsr.imports)) {
			const depVersion = allVersions.get(depName);
			if (depVersion) {
				const newSpec = toJsrSpecifier(depName, depVersion);
				if (specifier !== newSpec) {
					jsr.imports[depName] = newSpec;
					changed = true;
				}
			}
		}
	}

	if (changed) {
		writeJsrJson(pkgDir, jsr);
		console.log(`  ${relPath}/jsr.json -> ${version}`);
	} else {
		console.log(`  ${relPath} (no changes)`);
	}
}

// Main
function main(): void {
	const arg = process.argv[2];

	let newVersion: string | null = null;

	if (arg) {
		if (['major', 'minor', 'patch'].includes(arg)) {
			// Get current version from root package.json
			const rootPkg = JSON.parse(
				readFileSync(join(ROOT, 'package.json'), 'utf-8'),
			);
			newVersion = bumpVersion(
				rootPkg.version,
				arg as 'major' | 'minor' | 'patch',
			);
			console.log(`Bumping ${arg}: ${rootPkg.version} -> ${newVersion}\n`);

			// Also update root package.json
			rootPkg.version = newVersion;
			writeFileSync(
				join(ROOT, 'package.json'),
				JSON.stringify(rootPkg, null, 2) + '\n',
			);
		} else if (/^\d+\.\d+\.\d+/.test(arg)) {
			newVersion = arg;
			console.log(`Setting version to ${newVersion}\n`);

			// Also update root package.json
			const rootPkg = JSON.parse(
				readFileSync(join(ROOT, 'package.json'), 'utf-8'),
			);
			rootPkg.version = newVersion;
			writeFileSync(
				join(ROOT, 'package.json'),
				JSON.stringify(rootPkg, null, 2) + '\n',
			);
		} else {
			console.error(`Invalid argument: ${arg}`);
			console.error('Usage: sync-versions.ts [version|major|minor|patch]');
			process.exit(1);
		}
	} else {
		console.log('Syncing jsr.json files to match package.json versions\n');
	}

	const packages = findPackages();
	console.log(`Found ${packages.length} packages\n`);

	// First pass: update all package.json versions if bumping
	if (newVersion) {
		for (const pkgDir of packages) {
			const pkg = readPackageJson(pkgDir);
			if (pkg.version !== newVersion) {
				pkg.version = newVersion;
				writePackageJson(pkgDir, pkg);
			}
		}
	}

	// Get all package versions (after potential bump)
	const allVersions = getPackageVersions(packages);

	// Second pass: sync jsr.json files
	for (const pkgDir of packages) {
		syncPackage(pkgDir, newVersion, allVersions);
	}

	// Run JSR validation to ensure pnpm pack output matches jsr.json
	console.log('\nValidating JSR versions against pnpm pack output...');
	try {
		execSync('bun scripts/validate-jsr-versions.ts --fix', {
			cwd: ROOT,
			encoding: 'utf-8',
			stdio: 'inherit',
		});
	} catch {
		console.error('\nJSR validation failed. Please check the errors above.');
		process.exit(1);
	}

	console.log('\nDone!');

	if (newVersion) {
		console.log(`\nNext steps:`);
		console.log(`  1. Review changes: git diff`);
		console.log(
			`  2. Commit: git commit -am "chore: bump version to ${newVersion}"`,
		);
		console.log(`  3. Tag: git tag v${newVersion}`);
		console.log(`  4. Push: git push && git push --tags`);
	}
}

main();
