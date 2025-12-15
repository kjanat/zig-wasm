/// <reference types="bun-types" />
/// <reference types="@opencode-ai/plugin" />
import { tool } from "@opencode-ai/plugin";

import { decompressLzma, decompressXz } from "@zig-wasm/compress";

// ---------- compressXz: placeholder using system xz until Zig WASM compressor exists ----------

export const compressXz = tool({
  description: "Compress a file using xz (placeholder until Zig WASM compressor exists).",
  args: {
    input: tool.schema.string().describe("Input file path"),
    output: tool.schema.string().describe("Output .xz file path"),
  },
  async execute({ input, output }) {
    const proc = Bun.spawn(["xz", "-c", input], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).arrayBuffer(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      await Bun.write(output, stdout);
    }

    return JSON.stringify({
      tool: "compress_compressXz",
      command: `xz -c ${input} > ${output}`,
      input,
      output,
      exitCode,
      ok: exitCode === 0,
      outputSize: exitCode === 0 ? stdout.byteLength : null,
      stderr,
    });
  },
});

// ---------- compressLzma: placeholder using system lzma ----------

export const compressLzma = tool({
  description: "Compress a file using lzma (placeholder until Zig WASM compressor exists).",
  args: {
    input: tool.schema.string().describe("Input file path"),
    output: tool.schema.string().describe("Output .lzma file path"),
  },
  async execute({ input, output }) {
    const proc = Bun.spawn(["lzma", "-c", input], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).arrayBuffer(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      await Bun.write(output, stdout);
    }

    return JSON.stringify({
      tool: "compress_compressLzma",
      command: `lzma -c ${input} > ${output}`,
      input,
      output,
      exitCode,
      ok: exitCode === 0,
      outputSize: exitCode === 0 ? stdout.byteLength : null,
      stderr,
    });
  },
});

// ---------- compressGzip: using system gzip ----------

export const compressGzip = tool({
  description: "Compress a file using gzip. Uses system gzip command.",
  args: {
    input: tool.schema.string().describe("Input file path"),
    output: tool.schema.string().describe("Output .gz file path"),
    level: tool.schema
      .number()
      .int()
      .min(1)
      .max(9)
      .default(6)
      .describe("Compression level 1-9 (default: 6)"),
  },
  async execute({ input, output, level }) {
    const lvl = level ?? 6;
    const proc = Bun.spawn(["gzip", `-${lvl}`, "-c", input], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).arrayBuffer(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      await Bun.write(output, stdout);
    }

    return JSON.stringify({
      tool: "compress_compressGzip",
      command: `gzip -${lvl} -c ${input} > ${output}`,
      input,
      output,
      level: lvl,
      exitCode,
      ok: exitCode === 0,
      outputSize: exitCode === 0 ? stdout.byteLength : null,
      stderr,
    });
  },
});

// ---------- decompressGzip: using system gunzip ----------

export const decompressGzip = tool({
  description: "Decompress a gzip file. Uses system gunzip command.",
  args: {
    input: tool.schema.string().describe("Input .gz file path"),
    output: tool.schema.string().describe("Output file path"),
  },
  async execute({ input, output }) {
    const proc = Bun.spawn(["gunzip", "-c", input], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).arrayBuffer(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      await Bun.write(output, stdout);
    }

    return JSON.stringify({
      tool: "compress_decompressGzip",
      command: `gunzip -c ${input} > ${output}`,
      input,
      output,
      exitCode,
      ok: exitCode === 0,
      outputSize: exitCode === 0 ? stdout.byteLength : null,
      stderr,
    });
  },
});

// ---------- compressZstd: using system zstd ----------

export const compressZstd = tool({
  description: "Compress a file using zstd. Uses system zstd command.",
  args: {
    input: tool.schema.string().describe("Input file path"),
    output: tool.schema.string().describe("Output .zst file path"),
    level: tool.schema
      .number()
      .int()
      .min(1)
      .max(19)
      .default(3)
      .describe("Compression level 1-19 (default: 3)"),
  },
  async execute({ input, output, level }) {
    const lvl = level ?? 3;
    const proc = Bun.spawn(["zstd", `-${lvl}`, "-c", input], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).arrayBuffer(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      await Bun.write(output, stdout);
    }

    return JSON.stringify({
      tool: "compress_compressZstd",
      command: `zstd -${lvl} -c ${input} > ${output}`,
      input,
      output,
      level: lvl,
      exitCode,
      ok: exitCode === 0,
      outputSize: exitCode === 0 ? stdout.byteLength : null,
      stderr,
    });
  },
});

// ---------- decompressZstd: using system zstd ----------

export const decompressZstd = tool({
  description: "Decompress a zstd file. Uses system zstd command.",
  args: {
    input: tool.schema.string().describe("Input .zst file path"),
    output: tool.schema.string().describe("Output file path"),
  },
  async execute({ input, output }) {
    const proc = Bun.spawn(["zstd", "-d", "-c", input], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).arrayBuffer(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      await Bun.write(output, stdout);
    }

    return JSON.stringify({
      tool: "compress_decompressZstd",
      command: `zstd -d -c ${input} > ${output}`,
      input,
      output,
      exitCode,
      ok: exitCode === 0,
      outputSize: exitCode === 0 ? stdout.byteLength : null,
      stderr,
    });
  },
});

// ---------- compressDeflate: using system pigz (parallel gzip with raw deflate) ----------

export const compressDeflate = tool({
  description: "Compress a file using raw deflate (no gzip headers). Uses pigz --zlib or falls back to gzip.",
  args: {
    input: tool.schema.string().describe("Input file path"),
    output: tool.schema.string().describe("Output .deflate file path"),
  },
  async execute({ input, output }) {
    // Try pigz first (supports --zlib for raw deflate), fallback to gzip
    let proc = Bun.spawn(["pigz", "--zlib", "-c", input], {
      stdout: "pipe",
      stderr: "pipe",
    });

    let [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).arrayBuffer(),
      new Response(proc.stderr).text(),
    ]);
    let exitCode = await proc.exited;
    let command = `pigz --zlib -c ${input} > ${output}`;

    // If pigz not available, use gzip (note: gzip doesn't have raw deflate option)
    if (exitCode !== 0 && stderr.includes("not found")) {
      proc = Bun.spawn(["gzip", "-c", input], {
        stdout: "pipe",
        stderr: "pipe",
      });
      [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).arrayBuffer(),
        new Response(proc.stderr).text(),
      ]);
      exitCode = await proc.exited;
      command = `gzip -c ${input} > ${output} (note: gzip format, not raw deflate)`;
    }

    if (exitCode === 0) {
      await Bun.write(output, stdout);
    }

    return JSON.stringify({
      tool: "compress_compressDeflate",
      command,
      input,
      output,
      exitCode,
      ok: exitCode === 0,
      outputSize: exitCode === 0 ? stdout.byteLength : null,
      stderr,
      note: "For true raw deflate, pigz with --zlib is required",
    });
  },
});

type DecompressResult = {
  data_base64: string;
  text?: string;
};

async function handleDecompress(
  fn: (data: Uint8Array) => Promise<Uint8Array> | Uint8Array,
  data_base64: string,
  asText: boolean,
): Promise<DecompressResult> {
  const compressed = Buffer.from(data_base64, "base64");
  const decompressed = await fn(
    new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength),
  );

  const buf = Buffer.from(decompressed);
  const result: DecompressResult = {
    data_base64: buf.toString("base64"),
  };

  if (asText) {
    result.text = new TextDecoder().decode(decompressed);
  }

  return result;
}

export const decompressXzTool = tool({
  description: "Decompress XZ/LZMA2 data using @zig-wasm/compress. Input and output are base64-encoded.",
  args: {
    data_base64: tool.schema
      .string()
      .describe("Compressed XZ data as base64"),
    asText: tool.schema
      .boolean()
      .default(false)
      .describe(
        "Also decode output as UTF-8 text (for text payloads)",
      ),
  },
  async execute({ data_base64, asText }): Promise<string> {
    const result = await handleDecompress(decompressXz, data_base64, asText);
    return JSON.stringify(result);
  },
});

export const decompressLzmaTool = tool({
  description: "Decompress raw LZMA data using @zig-wasm/compress. Input and output are base64-encoded.",
  args: {
    data_base64: tool.schema
      .string()
      .describe("Compressed LZMA data as base64"),
    asText: tool.schema
      .boolean()
      .default(false)
      .describe(
        "Also decode output as UTF-8 text (for text payloads)",
      ),
  },
  async execute({ data_base64, asText }): Promise<string> {
    const result = await handleDecompress(decompressLzma, data_base64, asText);
    return JSON.stringify(result);
  },
});
