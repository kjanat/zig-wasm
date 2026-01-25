#!/usr/bin/env bun
/**
 * Bun test preload script - builds WASM test vectors before tests run
 */
import { $ } from 'bun';

if (!Bun.which('zig')) {
	throw new Error(
		'zig not found in PATH - required to build WASM test vectors',
	);
}

await $`zig build gen-test-vectors -Doptimize=ReleaseSmall`.quiet();
