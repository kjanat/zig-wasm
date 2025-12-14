import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Root tsconfig.base.json is the shared base config for all packages
const rootTsconfigPath = resolve(import.meta.dirname, "../tsconfig.base.json");

describe("Configuration Files", () => {
  describe("biome.json", () => {
    it("is valid JSON", () => {
      const configPath = resolve(import.meta.dirname, "../biome.json");
      const content = readFileSync(configPath, "utf-8");

      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("has required biome configuration structure", () => {
      const configPath = resolve(import.meta.dirname, "../biome.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(config).toHaveProperty("vcs");
      expect(config).toHaveProperty("files");
      expect(config).toHaveProperty("linter");
      expect(config).toHaveProperty("javascript");
    });

    it("enables linter with recommended rules", () => {
      const configPath = resolve(import.meta.dirname, "../biome.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(config.linter.enabled).toBe(true);
      expect(config.linter.rules.recommended).toBe(true);
    });

    it("enforces import extensions", () => {
      const configPath = resolve(import.meta.dirname, "../biome.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(config.linter.rules.correctness.useImportExtensions).toBe("error");
    });

    it("configures VCS integration", () => {
      const configPath = resolve(import.meta.dirname, "../biome.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(config.vcs.enabled).toBe(true);
      expect(config.vcs.clientKind).toBe("git");
      expect(config.vcs.defaultBranch).toBe("master");
    });

    it("ignores dist directories", () => {
      const configPath = resolve(import.meta.dirname, "../biome.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(config.files.includes).toContain("!!**/dist");
    });

    it("disables organize imports for index files", () => {
      const configPath = resolve(import.meta.dirname, "../biome.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));

      const indexOverride = config.overrides?.find((override: { includes?: string[] }) =>
        override.includes?.includes("**/index.ts")
      );

      expect(indexOverride).toBeDefined();
      expect(indexOverride.assist.actions.source.organizeImports).toBe("off");
    });

    it("uses double quotes for JavaScript", () => {
      const configPath = resolve(import.meta.dirname, "../biome.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(config.javascript.formatter.quoteStyle).toBe("double");
    });
  });

  describe("tsconfig.base.json (root)", () => {
    it("is valid JSON", () => {
      const content = readFileSync(rootTsconfigPath, "utf-8");

      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("has required TypeScript compiler options", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config).toHaveProperty("compilerOptions");
      expect(config.compilerOptions).toHaveProperty("target");
      expect(config.compilerOptions).toHaveProperty("module");
      expect(config.compilerOptions).toHaveProperty("strict");
    });

    it("enables strict mode", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.compilerOptions.strict).toBe(true);
    });

    it("targets modern JavaScript", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.compilerOptions.target).toBe("ES2022");
      expect(config.compilerOptions.module).toBe("ESNext");
      expect(config.compilerOptions.lib).toContain("ES2022");
    });

    it("uses bundler module resolution", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.compilerOptions.moduleResolution).toBe("bundler");
    });

    it("enables important safety features", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.compilerOptions.noUncheckedIndexedAccess).toBe(true);
      expect(config.compilerOptions.noImplicitOverride).toBe(true);
      expect(config.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
    });

    it("enables declaration generation", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.compilerOptions.declaration).toBe(true);
      expect(config.compilerOptions.declarationMap).toBe(true);
      expect(config.compilerOptions.sourceMap).toBe(true);
    });

    it("disables emit for noEmit mode", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.compilerOptions.noEmit).toBe(true);
    });

    it("enables isolated modules and verbatim module syntax", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.compilerOptions.isolatedModules).toBe(true);
      expect(config.compilerOptions.verbatimModuleSyntax).toBe(true);
    });

    it("allows TypeScript extensions in imports", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.compilerOptions.allowImportingTsExtensions).toBe(true);
    });

    it("does not have extends (it is the base)", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      expect(config.extends).toBeUndefined();
    });
  });

  describe("tsconfig.json (tooling package)", () => {
    it("is valid JSON", () => {
      const configPath = resolve(import.meta.dirname, "../tsconfig.json");
      const content = readFileSync(configPath, "utf-8");

      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("extends local tsconfig.base.json", () => {
      const configPath = resolve(import.meta.dirname, "../tsconfig.json");
      const config = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(config.extends).toBe("./tsconfig.base.json");
    });

    // Note: tooling's tsconfig.json only has "extends", inheriting include/exclude from base
  });

  describe("package.json", () => {
    it("is valid JSON", () => {
      const configPath = resolve(import.meta.dirname, "../package.json");
      const content = readFileSync(configPath, "utf-8");

      expect(() => JSON.parse(content)).not.toThrow();
    });

    it("has required package metadata", () => {
      const configPath = resolve(import.meta.dirname, "../package.json");
      const pkg = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(pkg.name).toBe("@zig-wasm/tooling");
      expect(pkg.type).toBe("module");
      expect(pkg.license).toBe("MIT");
    });

    it("exports configurations correctly", () => {
      const configPath = resolve(import.meta.dirname, "../package.json");
      const pkg = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(pkg.exports["."]).toBe("./src/index.ts");
      expect(pkg.exports["./biome"]).toBe("./biome.json");
      expect(pkg.exports["./tsconfig"]).toBe("./tsconfig.base.json");
    });

    it("defines CLI binaries", () => {
      const configPath = resolve(import.meta.dirname, "../package.json");
      const pkg = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(pkg.bin["check-published"]).toBe("./src/check-published.ts");
      expect(pkg.bin["sync-versions"]).toBe("./src/sync-versions.ts");
    });

    it("includes necessary files for distribution", () => {
      const configPath = resolve(import.meta.dirname, "../package.json");
      const pkg = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(pkg.files).toContain("biome.json");
      expect(pkg.files).toContain("tsconfig.base.json");
      expect(pkg.files).toContain("src");
    });

    it("has essential scripts", () => {
      const configPath = resolve(import.meta.dirname, "../package.json");
      const pkg = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(pkg.scripts).toHaveProperty("test");
      expect(pkg.scripts).toHaveProperty("lint");
      expect(pkg.scripts).toHaveProperty("typecheck");
      expect(pkg.scripts).toHaveProperty("fmt");
      expect(pkg.scripts).toHaveProperty("check-published");
      expect(pkg.scripts).toHaveProperty("sync-versions");
    });

    it("specifies TypeScript as peer dependency", () => {
      const configPath = resolve(import.meta.dirname, "../package.json");
      const pkg = JSON.parse(readFileSync(configPath, "utf-8"));

      expect(pkg.peerDependencies).toHaveProperty("typescript");
    });
  });

  describe("Config Interoperability", () => {
    it("biome and tsconfig quote styles are compatible", () => {
      const biomePath = resolve(import.meta.dirname, "../biome.json");
      const biomeConfig = JSON.parse(readFileSync(biomePath, "utf-8"));

      // Biome uses double quotes, which is standard for JSON/JS
      expect(biomeConfig.javascript.formatter.quoteStyle).toBe("double");
    });

    it("both configs target modern JavaScript", () => {
      const biomePath = resolve(import.meta.dirname, "../biome.json");
      const biomeConfig = JSON.parse(readFileSync(biomePath, "utf-8"));
      const tsconfig = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      // Both should work with ES2022+
      expect(tsconfig.compilerOptions.target).toBe("ES2022");
      expect(biomeConfig.vcs).toBeDefined(); // Modern Biome feature
    });

    it("biome ignores dist directories", () => {
      const biomePath = resolve(import.meta.dirname, "../biome.json");
      const biomeConfig = JSON.parse(readFileSync(biomePath, "utf-8"));

      // Biome should exclude dist
      expect(biomeConfig.files.includes).toContain("!!**/dist");
    });
  });

  describe("Config Extends Pattern", () => {
    it("biome config can be extended", () => {
      const biomePath = resolve(import.meta.dirname, "../biome.json");
      const config = JSON.parse(readFileSync(biomePath, "utf-8"));

      // Should not have "extends" itself (it's the base config)
      expect(config.extends).toBeUndefined();

      // But should be structured for extension
      expect(config.linter.enabled).toBe(true);
      expect(config.linter.rules).toBeDefined();
    });

    it("root tsconfig.base.json can be extended", () => {
      const config = JSON.parse(readFileSync(rootTsconfigPath, "utf-8"));

      // Should not have "extends" itself (it's the base config)
      expect(config.extends).toBeUndefined();

      // But should have all necessary options for extension
      expect(config.compilerOptions.strict).toBe(true);
    });

    it("all package tsconfigs extend tooling base", () => {
      const packages = ["core", "hash", "math", "base64", "compress", "crypto", "std"];

      for (const pkg of packages) {
        const pkgTsconfigPath = resolve(import.meta.dirname, `../../../packages/${pkg}/tsconfig.json`);
        const config = JSON.parse(readFileSync(pkgTsconfigPath, "utf-8"));

        expect(config.extends).toBe("@zig-wasm/tooling/tsconfig");
      }
    });
  });
});
