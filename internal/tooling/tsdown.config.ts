import { defineConfig } from 'tsdown';

export default defineConfig({
	banner: `/**
 * @package "@zig-wasm/tooling"
 * @license MIT
 */
`,
	exports: {
		devExports: 'bun',
		customExports(pkg) {
			pkg['./biome'] = './configs/biome.base.json';
			pkg['./tsconfig'] = './configs/tsconfig.base.json';
			return pkg;
		},
	},
});
