import { defineConfig } from "tsdown";
import { baseConfig } from "../../tsdown.config.ts";

export default defineConfig({
  ...baseConfig,
  unused: false, // Disabled: packages legitimately depend on core even if not imported yet
});
