import { tool } from "@opencode-ai/plugin";
import "../node_modules/@opencode-ai/plugin/dist/index.d.ts";

import { hashHex, hmacHex } from "../../packages/crypto/dist/index.mjs";

const ALGORITHMS = /* dprint-ignore */ [
  "md5", "sha1", "sha256", "sha384", "sha512", "sha3-256", "sha3-512",
  "blake2b256", "blake2s256", "blake3",
] as const;

type Algorithm = (typeof ALGORITHMS)[number];

export const hash = tool({
  description: "Hash a UTF-8 string with @zig-wasm/crypto and return a hex digest.",
  args: {
    algorithm: tool.schema
      .enum([...ALGORITHMS])
      .describe("Hash algorithm to use"),
    data: tool.schema
      .string()
      .describe("Input string (interpreted as UTF-8)"),
  },
  async execute({ algorithm, data }, _context) {
    const hex = await hashHex(algorithm as Algorithm, data);
    return hex;
  },
});

export const hmac = tool({
  description: "Compute an HMAC (SHA256 or SHA512) using @zig-wasm/crypto and return a hex digest.",
  args: {
    algorithm: tool.schema
      .enum(["sha256", "sha512"])
      .describe("HMAC algorithm"),
    key: tool.schema
      .string()
      .describe("Secret key as UTF-8 string"),
    data: tool.schema
      .string()
      .describe("Message as UTF-8 string"),
  },
  async execute({ algorithm, key, data }) {
    const hex = await hmacHex(algorithm, key, data);
    return `${algorithm}: ${hex}`;
  },
});
