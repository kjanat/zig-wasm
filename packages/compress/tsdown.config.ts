import { defineConfig } from "tsdown";
import { wasmConfig } from "../../tsdown.config.ts";

export default defineConfig(wasmConfig("compress"));
