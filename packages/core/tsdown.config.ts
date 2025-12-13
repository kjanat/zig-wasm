import { defineConfig } from "tsdown";
import { packageConfig } from "../../tsdown.config.ts";

export default defineConfig({
  ...packageConfig("core"),
  unused: false, // Disabled: packages legitimately depend on core even if not imported yet
});
