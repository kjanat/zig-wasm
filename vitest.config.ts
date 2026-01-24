import { globSync } from 'glob';
import { readFileSync } from 'node:fs';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';
import type { TestProjectConfiguration, TestUserConfig } from 'vitest/config';

const createProjectConfig = (
	path: string,
	name: string,
): TestProjectConfiguration => ({
	test: {
		name,
		include: [`${path}/__tests__/**/*.test.ts`],
		testTimeout: 10_000,
	},
	plugins: [tsconfigPaths()],
});

const projects: TestUserConfig['projects'] = globSync(
	'{packages,internal}/*/package.json',
).map((pkgPath) => {
	const path = pkgPath.replace('/package.json', '');
	const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
	return createProjectConfig(path, pkg.name);
});

const ciReporters: TestUserConfig['reporters'] = [
	'default',
	'github-actions',
	'junit',
	'html',
];

const localReporters: TestUserConfig['reporters'] = [
	['verbose', { summary: true }],
	['html', { open: false }],
];

const getCoverageConfig = (isCI: boolean): TestUserConfig['coverage'] => ({
	provider: 'v8',
	reporter: isCI ? ['text', 'lcov', 'json', 'json-summary'] : ['text', 'html'],
	reportsDirectory: 'coverage',
	include: ['packages/*/src/**/*.ts', 'internal/*/src/**/*.ts'],
	exclude: [
		...(configDefaults.coverage.exclude || []),
		'**/index.ts',
		'**/*.test.ts',
		'**/__tests__/**',
		'**/tests/**',
		'**/*.d.ts',
		'**/types.ts',
	],
	thresholds: {
		lines: 80,
		functions: 80,
		branches: 80,
		statements: 80,
	},
});

const getTestConfig = (isCI: boolean): TestUserConfig => ({
	projects,
	environment: 'node',
	globals: false,
	open: false,
	exclude: [
		...configDefaults.exclude,
		'**/dist/**',
		'**/coverage/**',
		'**/.zig-cache/**',
		'**/zig-out/**',
	],
	reporters: isCI ? ciReporters : localReporters,
	outputFile: {
		junit: 'test-results/junit.xml',
		json: 'test-results/results.json',
	},
	coverage: getCoverageConfig(isCI),
	typecheck: {
		enabled: true,
		include: ['**/*.test.ts'],
	},
});

export default defineConfig(({ mode }) => ({
	test: getTestConfig(
		mode === 'ci' || process.env.CI === 'true' || process.env.AGENT === 'true',
	),
	assetsInclude: ['**/*.wasm'],
}));
