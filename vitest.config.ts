import { defineConfig } from "vitest/config";

const isCI = process.env.CI === "true";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/tests/**/*.test.ts"],
    exclude: ["**/dist/**", "**/node_modules/**"],
    reporters: isCI
      ? ["default", "github-actions", "junit"]
      : ["default"],
    outputFile: {
      junit: "test-results/junit.xml",
    },
    coverage: {
      provider: "v8",
      reporter: isCI
        ? ["text", "lcov", "json"]
        : ["text"],
      reportsDirectory: "coverage",
      exclude: ["package.json"],
    },
  },
});
