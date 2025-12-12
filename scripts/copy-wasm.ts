#!/usr/bin/env bun

async function copyPackages(packages: string[]) {
  if (packages.length === 0) return;

  const [pkg, ...rest] = packages;
  const src = `zig-out/packages/${pkg}/dist/${pkg}.wasm`;
  const destDir = `packages/${pkg}/dist`;
  const dest = `${destDir}/${pkg}.wasm`;

  const srcFile = Bun.file(src);
  if (await srcFile.exists()) {
    await Bun.$`mkdir -p ${destDir}`;
    await Bun.write(dest, srcFile);
    console.log(`Copied ${pkg}.wasm`);
  }

  await copyPackages(rest);
}

await copyPackages(["crypto", "hash", "compress", "base64", "math"]);
