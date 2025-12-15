import { globSync, readFileSync } from "node:fs";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";
import type { TestProjectConfiguration, TestUserConfig } from "vitest/config";

const createProjectConfig = (path: string, name: string): TestProjectConfiguration => ({
  test: {
    name,
    include: [`${path}/{tests,__tests__}/**/*.test.ts`],
  },
  plugins: [tsconfigPaths()],
});

const projects: TestUserConfig["projects"] = globSync("{packages,internal}/*/package.json")
  .map((pkgPath) => {
    const path = pkgPath.replace("/package.json", "");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return createProjectConfig(path, pkg.name);
  });

const ciReporters: TestUserConfig["reporters"] = /* dprint-ignore */ [
  "default", "github-actions", "junit", "html",
];

const localReporters: TestUserConfig["reporters"] = /* dprint-ignore */ [
  ["tree", { summary: true }], ["html", { open: false }],
];

const getCoverageConfig = (isCI: boolean): TestUserConfig["coverage"] => ({
  provider: "v8",
  reporter: isCI ? ["text", "lcov", "json"] : ["text"],
  reportsDirectory: "coverage",
  exclude: ["**/packages/*/{src,{tests,__tests__}/*}/index.ts"],
});

const getTestConfig = (isCI: boolean): TestUserConfig => ({
  projects,
  environment: "node",
  open: false,
  exclude: [...configDefaults.exclude, "**/dist/**"],
  reporters: isCI ? ciReporters : localReporters,
  outputFile: { junit: "test-results/junit.xml" },
  coverage: getCoverageConfig(isCI),
  typecheck: { enabled: true },
});

export default defineConfig(({ mode }) => ({
  test: getTestConfig(mode === "ci" || (process.env.CI === "true" || process.env.AGENT === "true")),
}));
