#!/usr/bin/env bun
/**
 * Validates that jsr.json versions and import mappings match what pnpm pack would produce.
 *
 * This ensures JSR publishes use the same resolved versions as npm publishes.
 *
 * Usage:
 *   node --experimental-strip-types scripts/validate-jsr-versions.ts [--fix]
 *   # or with bun/tsx
 *   bun scripts/validate-jsr-versions.ts [--fix]
 *
 * Exit codes:
 *   0 - All versions match
 *   1 - Version mismatches found (or fixed with --fix)
 */

import { execSync } from 'node:child_process';
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
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

interface ValidationError {
	package: string;
	field: string;
	expected: string;
	actual: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const FIX_MODE = process.argv.includes('--fix');

// Find all packages with jsr.json
function findJsrPackages(): string[] {
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

// Get resolved manifest from pnpm pack
function getPackedManifest(pkgDir: string): PackageJson {
	const tmpDir = mkdtempSync(join(tmpdir(), 'jsr-validate-'));

	try {
		// Pack the package
		const packResult = execSync('pnpm pack --json', {
			cwd: pkgDir,
			encoding: 'utf-8',
		});
		const packInfo = JSON.parse(packResult);
		const tarball = join(pkgDir, packInfo.filename);

		// Extract to temp dir
		execSync(`tar -xzf "${tarball}" -C "${tmpDir}"`, { encoding: 'utf-8' });

		// Read the resolved package.json
		const manifestPath = join(tmpDir, 'package', 'package.json');
		const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

		function getPackedManifest(pkgDir: string): PackageJson {
			const tmpDir = mkdtempSync(join(tmpdir(), 'jsr-validate-'));
			let tarball: string | undefined;

			try {
				const packResult = execSync('pnpm pack --json', {
					cwd: pkgDir,
					encoding: 'utf-8',
				});
				const packInfo = JSON.parse(packResult);
				tarball = join(pkgDir, packInfo.filename);

				execSync(`tar -xzf "${tarball}" -C "${tmpDir}"`, { encoding: 'utf-8' });

				const manifestPath = join(tmpDir, 'package', 'package.json');
				const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

				return manifest;
			} finally {
				if (tarball) rmSync(tarball, { force: true });
				rmSync(tmpDir, { recursive: true, force: true });
			}
		}

		return manifest;
	} finally {
		rmSync(tmpDir, { recursive: true, force: true });
	}
}

// Read jsr.json
function readJsrJson(pkgDir: string): JsrJson {
	const jsrPath = join(pkgDir, 'jsr.json');
	return JSON.parse(readFileSync(jsrPath, 'utf-8'));
}

// Parse JSR import specifier: "jsr:@scope/pkg@^1.0.0" -> { name: "@scope/pkg", version: "^1.0.0" }
function parseJsrImport(specifier: string): { name: string; version: string } {
	const match = specifier.match(/^jsr:(@[^@]+)@(.+)$/);
	if (!match) {
		throw new Error(`Invalid JSR specifier: ${specifier}`);
	}
	return { name: match[1], version: match[2] };
}

// Convert pnpm resolved version to JSR import specifier
function toJsrSpecifier(name: string, version: string): string {
	// pnpm resolves workspace:* to exact version (e.g., "0.1.0")
	// JSR imports should use caret range for flexibility
	const jsrVersion = version.startsWith('^') ? version : `^${version}`;
	return `jsr:${name}@${jsrVersion}`;
}

// Validate a single package
function validatePackage(pkgDir: string): ValidationError[] {
	const errors: ValidationError[] = [];
	const relPath = relative(ROOT, pkgDir);

	console.log(`Validating ${relPath}...`);

	const jsrJson = readJsrJson(pkgDir);
	const packedManifest = getPackedManifest(pkgDir);

	// Check version matches
	if (jsrJson.version !== packedManifest.version) {
		errors.push({
			package: relPath,
			field: 'version',
			expected: packedManifest.version,
			actual: jsrJson.version,
		});
	}

	// Check imports match resolved dependencies
	const packedDeps = packedManifest.dependencies ?? {};
	const jsrImports = jsrJson.imports ?? {};

	// Check each JSR import against packed dependencies
	for (const [importName, importSpec] of Object.entries(jsrImports)) {
		const parsed = parseJsrImport(importSpec);

		// Find matching dependency in packed manifest
		const packedVersion = packedDeps[importName];
		if (!packedVersion) {
			errors.push({
				package: relPath,
				field: `imports["${importName}"]`,
				expected: '(not a dependency)',
				actual: importSpec,
			});
			continue;
		}

		// Compare versions (allow caret prefix difference)
		const expectedSpec = toJsrSpecifier(parsed.name, packedVersion);
		if (importSpec !== expectedSpec) {
			errors.push({
				package: relPath,
				field: `imports["${importName}"]`,
				expected: expectedSpec,
				actual: importSpec,
			});
		}
	}

	// Check for missing imports (deps in packed that aren't in jsr imports)
	for (const [depName, depVersion] of Object.entries(packedDeps)) {
		// Only check @zig-wasm/* deps (internal workspace deps)
		if (!depName.startsWith('@zig-wasm/')) continue;

		if (!jsrImports[depName]) {
			errors.push({
				package: relPath,
				field: `imports["${depName}"]`,
				expected: toJsrSpecifier(depName, depVersion),
				actual: '(missing)',
			});
		}
	}

	return errors;
}

// Fix jsr.json to match packed manifest
function fixJsrJson(pkgDir: string): void {
	const jsrPath = join(pkgDir, 'jsr.json');
	const jsrJson = readJsrJson(pkgDir);
	const packedManifest = getPackedManifest(pkgDir);

	// Fix version
	jsrJson.version = packedManifest.version;

	// Fix imports
	const packedDeps = packedManifest.dependencies ?? {};
	const newImports: Record<string, string> = {};

	for (const [depName, depVersion] of Object.entries(packedDeps)) {
		if (depName.startsWith('@zig-wasm/')) {
			newImports[depName] = toJsrSpecifier(depName, depVersion);
		}
	}

	if (Object.keys(newImports).length > 0) {
		jsrJson.imports = newImports;
	} else {
		delete jsrJson.imports;
	}

	// Write back
	writeFileSync(jsrPath, JSON.stringify(jsrJson, null, 2) + '\n');
	console.log(`  Fixed ${relative(ROOT, jsrPath)}`);
}

// Main
function main(): void {
	console.log('JSR Version Validation\n');
	console.log(`Mode: ${FIX_MODE ? 'FIX' : 'CHECK'}\n`);

	const packages = findJsrPackages();
	console.log(`Found ${packages.length} packages with jsr.json\n`);

	const allErrors: ValidationError[] = [];

	for (const pkgDir of packages) {
		const errors = validatePackage(pkgDir);

		if (errors.length > 0) {
			if (FIX_MODE) {
				fixJsrJson(pkgDir);
			} else {
				allErrors.push(...errors);
			}
		} else {
			console.log('  OK');
		}
		console.log();
	}

	if (allErrors.length > 0) {
		console.log('\nValidation Errors:');
		console.log('==================\n');

		for (const err of allErrors) {
			console.log(`${err.package}:`);
			console.log(`  ${err.field}:`);
			console.log(`    expected: ${err.expected}`);
			console.log(`    actual:   ${err.actual}`);
			console.log();
		}

		console.log(`\nRun with --fix to auto-correct these issues.`);
		process.exit(1);
	}

	if (FIX_MODE) {
		console.log('All jsr.json files have been updated.');
	} else {
		console.log('All versions are in sync.');
	}
}

main();
