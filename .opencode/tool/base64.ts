/// <reference types="bun-types" />
/// <reference types="@opencode-ai/plugin" />
import { tool } from "@opencode-ai/plugin";

import {
  decode,
  decodeNoPadding,
  decodeUrl,
  decodeUrlNoPadding,
  encode,
  encodeNoPadding,
  encodeUrl,
  encodeUrlNoPadding,
  hexDecode,
  hexEncode,
} from "@zig-wasm/base64";

const VARIANTS = [
  "standard",
  "noPadding",
  "url",
  "urlNoPadding",
] as const;

type Variant = (typeof VARIANTS)[number];

function encodeVariant(variant: Variant, data: string) {
  switch (variant) {
    case "standard":
      return encode(data);
    case "noPadding":
      return encodeNoPadding(data);
    case "url":
      return encodeUrl(data);
    case "urlNoPadding":
      return encodeUrlNoPadding(data);
  }
}

function decodeVariant(variant: Variant, str: string) {
  switch (variant) {
    case "standard":
      return decode(str);
    case "noPadding":
      return decodeNoPadding(str);
    case "url":
      return decodeUrl(str);
    case "urlNoPadding":
      return decodeUrlNoPadding(str);
  }
}

export const encodeBase64 = tool({
  description: "Encode a UTF-8 string to Base64 using @zig-wasm/base64 (standard/url, with or without padding).",
  args: {
    data: tool.schema
      .string()
      .describe("Input string (UTF-8)"),
    variant: tool.schema
      .enum(VARIANTS as unknown as [Variant, ...Variant[]])
      .default("standard")
      .describe("Base64 variant to use"),
  },
  async execute({ data, variant }): Promise<string> {
    const b64 = await encodeVariant(variant, data);
    return b64;
  },
});

export const decodeBase64 = tool({
  description: "Decode Base64 using @zig-wasm/base64 and return UTF-8 text plus a base64-encoded raw byte dump.",
  args: {
    base64: tool.schema
      .string()
      .describe("Base64 string to decode"),
    variant: tool.schema
      .enum(VARIANTS as unknown as [Variant, ...Variant[]])
      .default("standard")
      .describe("Base64 variant used"),
    asText: tool.schema
      .boolean()
      .default(true)
      .describe("Whether to decode bytes as UTF-8 text too"),
  },
  async execute({ base64, variant, asText }): Promise<string> {
    const bytes = await decodeVariant(variant, base64);
    if (asText) {
      return new TextDecoder().decode(bytes);
    }
    return Buffer.from(bytes).toString("base64");
  },
});

// ---------- encodeFile: encode a file to base64 ----------

export const encodeFile = tool({
  description: "Encode a file to Base64 using @zig-wasm/base64. Returns base64 string (can be large for big files).",
  args: {
    path: tool.schema.string().describe("Path to the file to encode"),
    variant: tool.schema
      .enum(VARIANTS as unknown as [Variant, ...Variant[]])
      .default("standard")
      .describe("Base64 variant to use"),
  },
  async execute({ path, variant }): Promise<string> {
    const file = Bun.file(path);
    const exists = await file.exists();
    if (!exists) {
      return JSON.stringify({
        tool: "base64_encodeFile",
        path,
        exists: false,
        error: "File not found",
      });
    }

    const bytes = await file.arrayBuffer();
    const u8 = new Uint8Array(bytes);

    // Use Bun's native base64 for file encoding (faster for large files)
    let b64: string;
    switch (variant) {
      case "standard":
        b64 = Buffer.from(u8).toString("base64");
        break;
      case "noPadding":
        b64 = Buffer.from(u8).toString("base64").replace(/=+$/, "");
        break;
      case "url":
        b64 = Buffer.from(u8).toString("base64url");
        // base64url in Node/Bun already has padding
        break;
      case "urlNoPadding":
        b64 = Buffer.from(u8).toString("base64url").replace(/=+$/, "");
        break;
    }

    return JSON.stringify({
      tool: "base64_encodeFile",
      path,
      variant,
      sizeBytes: bytes.byteLength,
      base64Length: b64.length,
      base64: b64,
    });
  },
});

// ---------- decodeFile: decode base64 to a file ----------

export const decodeFile = tool({
  description: "Decode Base64 to a file using @zig-wasm/base64.",
  args: {
    base64: tool.schema.string().describe("Base64 string to decode"),
    path: tool.schema.string().describe("Output file path"),
    variant: tool.schema
      .enum(VARIANTS as unknown as [Variant, ...Variant[]])
      .default("standard")
      .describe("Base64 variant used"),
  },
  async execute({ base64, path, variant }): Promise<string> {
    let bytes: Uint8Array;
    try {
      bytes = await decodeVariant(variant, base64);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        tool: "base64_decodeFile",
        path,
        variant,
        ok: false,
        error: `Decode failed: ${message}`,
      });
    }

    await Bun.write(path, bytes);

    return JSON.stringify({
      tool: "base64_decodeFile",
      path,
      variant,
      ok: true,
      sizeBytes: bytes.length,
    });
  },
});

export const hexCodec = tool({
  description: "Encode/decode hex using @zig-wasm/base64 hex helpers.",
  args: {
    mode: tool.schema
      .enum(["encode", "decode"])
      .describe("Encode to hex or decode from hex"),
    data: tool.schema
      .string()
      .describe(
        "UTF-8 text when encoding, hex string when decoding",
      ),
  },
  async execute({ mode, data }): Promise<string> {
    if (mode === "encode") {
      return hexEncode(new TextEncoder().encode(data));
    }
    const bytes = await hexDecode(data);
    return new TextDecoder().decode(bytes);
  },
});
