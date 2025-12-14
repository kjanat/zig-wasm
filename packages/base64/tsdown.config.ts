import { defineConfig } from "tsdown";
import { wasmConfig } from "zig-wasm/tsdown";

export default defineConfig(wasmConfig("base64"));
