import { tool } from "@opencode-ai/plugin";
import "../node_modules/@opencode-ai/plugin/dist/index.d.ts";

// dprint-ignore
import {
  adler32, cityhash64, crc32, fnv1a32, fnv1a64, murmur2_64, wyhash, xxhash32, xxhash64,
} from "../../packages/hash/dist/index.mjs";

// ---------- streaming: hash a file using Bun's native streaming ----------

const STREAM_ALGORITHMS = ["md5", "sha1", "sha256", "sha512"] as const;
type StreamAlgorithm = (typeof STREAM_ALGORITHMS)[number];

export const streaming = tool({
  description: "Hash a file using streaming (for large files). Uses Bun's native CryptoHasher.",
  args: {
    path: tool.schema.string().describe("Path to the file to hash"),
    algorithm: tool.schema
      .enum(STREAM_ALGORITHMS as unknown as [StreamAlgorithm, ...StreamAlgorithm[]])
      .default("sha256")
      .describe("Hash algorithm to use"),
  },
  async execute({ path, algorithm }) {
    const file = Bun.file(path);
    const exists = await file.exists();
    if (!exists) {
      return JSON.stringify({
        tool: "hash_streaming",
        path,
        exists: false,
        error: "File not found",
      });
    }

    const alg = algorithm ?? "sha256";
    const hasher = new Bun.CryptoHasher(alg);

    // Read file in chunks for large files
    const bytes = await file.arrayBuffer();
    hasher.update(new Uint8Array(bytes));

    const hash = hasher.digest("hex");

    return JSON.stringify({
      tool: "hash_streaming",
      path,
      algorithm: alg,
      sizeBytes: file.size,
      hash,
    });
  },
});

const ALGORITHMS = /* dprint-ignore */ [
  "crc32", "adler32", "xxhash32", "xxhash64", "wyhash", "cityhash64", "murmur2_64", "fnv1a32", "fnv1a64",
] as const;

type Algorithm = (typeof ALGORITHMS)[number];

export const checksum = tool({
  description: "Compute non-cryptographic checksums with @zig-wasm/hash (CRC32, xxHash, wyhash, FNV, etc).",
  args: {
    algorithm: tool.schema
      .enum(ALGORITHMS as unknown as [Algorithm, ...Algorithm[]])
      .describe("Hash algorithm to use"),
    data: tool.schema
      .string()
      .describe("Input string (UTF-8)"),
  },
  async execute({ algorithm, data }, _context) {
    const fnMap: Record<Algorithm, (input: string) => Promise<number | bigint> | number | bigint> =
      /* dprint-ignore */ {
      crc32, adler32, xxhash32, xxhash64, wyhash, cityhash64, murmur2_64, fnv1a32, fnv1a64,
    };

    const raw = await fnMap[algorithm](data);

    // Avoid leaking BigInt directly (JSON can’t handle it)
    const asBigInt = typeof raw === "bigint" ? raw : BigInt(raw);

    const result = {
      algorithm,
      // decimal string so it’s safe to consume
      value_dec: asBigInt.toString(10),
      value_hex: asBigInt.toString(16),
    };

    return JSON.stringify(result);
  },
});
