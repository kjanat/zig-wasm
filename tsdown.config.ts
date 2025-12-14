import { codecovRollupPlugin } from "@codecov/rollup-plugin";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type UserConfig } from "tsdown";

const repoUrl = "https://github.com/kjanat/zig-wasm";
const repoRoot = dirname(fileURLToPath(import.meta.url));

const licenseInfo = (() => {
  try {
    const content = readFileSync(join(repoRoot, "LICENSE"), "utf-8");
    const match = content.match(/Copyright \(c\)\s+(\d+)\s+(.+)/);
    if (!match || !match[1] || !match[2]) return { year: "", holder: "" };
    return { year: match[1], holder: match[2].trim() };
  } catch {
    return { year: "", holder: "" };
  }
})();

const gitInfo = (() => {
  const buildTime = new Date().toISOString();
  let hash = "unknown";
  let dirty = "";
  try {
    hash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim() || hash;
  } catch {}
  try {
    const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
    if (status) dirty = "+dirty";
  } catch {}
  return { hash, dirty, buildTime };
})();

function getPackageVersion(packageName: string): string {
  try {
    const pkgPath = join(repoRoot, "packages", packageName, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return typeof pkg.version === "string" ? pkg.version : "";
  } catch {
    return "";
  }
}

function resolveWorkspaceVersion(dependencyName: string): string {
  const name = dependencyName.replace(/^@zig-wasm\//, "");
  const fallback = "0.1.0";
  const candidates = [
    join(repoRoot, "packages", name, "package.json"),
    join(repoRoot, "internal", name, "package.json"),
  ];

  for (const candidate of candidates) {
    try {
      if (!existsSync(candidate)) continue;
      const pkg = JSON.parse(readFileSync(candidate, "utf-8"));
      const version = typeof pkg.version === "string" ? pkg.version : "";
      if (version) return version;
    } catch {}
  }

  return fallback;
}

function injectJsrImports(packageRoot: string): void {
  const jsrPath = join(packageRoot, "jsr.json");
  const packageJsonPath = join(packageRoot, "package.json");

  if (!existsSync(jsrPath) || !existsSync(packageJsonPath)) return;

  try {
    const jsrConfig = JSON.parse(readFileSync(jsrPath, "utf-8"));
    const pkgConfig = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    const imports = typeof jsrConfig.imports === "object" && jsrConfig.imports !== null
      ? { ...jsrConfig.imports }
      : {};

    const dependencies = pkgConfig.dependencies && typeof pkgConfig.dependencies === "object"
      ? pkgConfig.dependencies
      : {};

    for (const [dep, range] of Object.entries(dependencies)) {
      if (dep.startsWith("@zig-wasm/") && typeof range === "string" && range.startsWith("workspace:")) {
        const version = resolveWorkspaceVersion(dep);
        imports[dep] = `jsr:${dep}@^${version}`;
      }
    }

    if (Object.keys(imports).length > 0) {
      jsrConfig.imports = imports;
      writeFileSync(jsrPath, JSON.stringify(jsrConfig, null, 2) + "\n");
    }
  } catch (err) {
    console.warn(`Failed to update JSR imports for ${packageRoot}:`, err);
  }
}

export function ensureJsrImports(packageName: string): void {
  const packageRoot = join(repoRoot, "packages", packageName);
  injectJsrImports(packageRoot);
}

export function getBanner(packageName: string): string {
  const version = getPackageVersion(packageName);
  const versionSuffix = version ? ` v${version}` : "";

  const lines = [
    "/**",
    ` * @zig-wasm/${packageName}${versionSuffix}`,
    ...(licenseInfo.year && licenseInfo.holder ? [` * (c) ${licenseInfo.year} ${licenseInfo.holder}`] : []),
    " * @license MIT",
    ` * @source ${repoUrl}/tree/master/packages/${packageName}`,
    ` * @build ${gitInfo.hash}${gitInfo.dirty}${gitInfo.buildTime ? ` ${gitInfo.buildTime}` : ""}`,
    " */",
    "",
  ];

  return lines.join("\n");
}

export function getCodecovPlugin(bundleName: string) {
  const token = process.env.CODECOV_TOKEN;
  if (!token) return [];

  return [
    codecovRollupPlugin({
      enableBundleAnalysis: true,
      bundleName,
      uploadToken: token,
    }),
  ];
}

export const baseConfig: UserConfig = {
  entry: ["./src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: false,
  sourcemap: true,
  treeshake: true,
  exports: true,
  publint: true,
};

export function wasmConfig(packageName: string, overrides: Partial<UserConfig> = {}): UserConfig {
  const packageRoot = join(repoRoot, "packages", packageName);

  const jsrPath = join(packageRoot, "jsr.json");
  const packageJsonPath = join(packageRoot, "package.json");

  try {
    if (existsSync(jsrPath)) {
      const jsrContent = readFileSync(jsrPath, "utf-8");
      const jsrConfig = JSON.parse(jsrContent);

      jsrConfig.exports = {
        ".": typeof jsrConfig.exports === "string" ? jsrConfig.exports : "./src/index.ts",
        [`./${packageName}.wasm`]: `./wasm/${packageName}.wasm`,
      };

      if (!jsrConfig.publish) {
        jsrConfig.publish = { exclude: ["!wasm"] };
      }

      writeFileSync(jsrPath, JSON.stringify(jsrConfig, null, 2) + "\n");
    }

    if (existsSync(packageJsonPath)) {
      const pkgContent = readFileSync(packageJsonPath, "utf-8");
      const pkgConfig = JSON.parse(pkgContent);
      const hasExportsObject = typeof pkgConfig.exports === "object" && pkgConfig.exports !== null;

      if (hasExportsObject) {
        pkgConfig.exports[`./${packageName}.wasm`] = `./dist/${packageName}.wasm`;
        writeFileSync(packageJsonPath, JSON.stringify(pkgConfig, null, 2) + "\n");
      }
    }

    injectJsrImports(packageRoot);
  } catch (err) {
    console.warn(`Failed to update metadata for ${packageName}:`, err);
  }

  const { plugins: overridePlugins, ...restOverrides } = overrides;
  const merged = { ...baseConfig, ...restOverrides } satisfies UserConfig;

  const mergedPlugins = [
    ...getCodecovPlugin(`@zig-wasm/${packageName}`),
    ...(overridePlugins ? (Array.isArray(overridePlugins) ? overridePlugins : [overridePlugins]) : []),
  ];

  const banner = overrides.banner ?? getBanner(packageName);

  return {
    ...merged,
    banner,
    plugins: mergedPlugins,
    exports: {
      customExports(pkg) {
        pkg[`./${packageName}.wasm`] = `./wasm/${packageName}.wasm`;
        return pkg;
      },
    },
  };
}

export function packageConfig(packageName: string, overrides: Partial<UserConfig> = {}): UserConfig {
  const { plugins: overridePlugins, ...restOverrides } = overrides;
  const merged = { ...baseConfig, ...restOverrides } satisfies UserConfig;

  const mergedPlugins = [
    ...getCodecovPlugin(`@zig-wasm/${packageName}`),
    ...(overridePlugins ? (Array.isArray(overridePlugins) ? overridePlugins : [overridePlugins]) : []),
  ];

  const banner = overrides.banner ?? getBanner(packageName);
  const packageRoot = join(repoRoot, "packages", packageName);

  try {
    injectJsrImports(packageRoot);
  } catch (err) {
    console.warn(`Failed to update JSR imports for ${packageName}:`, err);
  }

  return {
    ...merged,
    banner,
    plugins: mergedPlugins,
  };
}

function ensureStdImports(): void {
  const stdRoot = join(repoRoot, "packages", "std");
  injectJsrImports(stdRoot);
}

export default defineConfig({
  workspace: ["./packages/*", "./internal/*"],
  hooks: {
    "build:before": ensureStdImports,
  },
});
