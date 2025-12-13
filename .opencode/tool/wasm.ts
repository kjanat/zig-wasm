import { tool } from "@opencode-ai/plugin";
import "../node_modules/@opencode-ai/plugin/dist/index.d.ts";

// --- helpers for parsing WASM binary sections ---

// WASM section IDs (for reference, not currently used in code)
const _SECTION_IDS = {
  custom: 0,
  type: 1,
  import: 2,
  function: 3,
  table: 4,
  memory: 5,
  global: 6,
  export: 7,
  start: 8,
  element: 9,
  code: 10,
  data: 11,
  dataCount: 12,
} as const;

const SECTION_NAMES: Record<number, string> = {
  0: "custom",
  1: "type",
  2: "import",
  3: "function",
  4: "table",
  5: "memory",
  6: "global",
  7: "export",
  8: "start",
  9: "element",
  10: "code",
  11: "data",
  12: "dataCount",
};

function readVarUint32(bytes: Uint8Array, offset: number): [value: number, next: number] {
  let result = 0;
  let shift = 0;
  let pos = offset;

  while (pos < bytes.length) {
    const byte = bytes[pos++];
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }

  return [result >>> 0, pos];
}

type MemoryLimits = {
  minPages: number;
  maxPages: number | null;
  minBytes: number;
  maxBytes: number | null;
};

function parseMemoryLimits(bytes: Uint8Array): MemoryLimits[] {
  const PAGE_SIZE = 65536;
  if (bytes.length < 8) return [];

  let offset = 8; // skip magic + version
  const memories: MemoryLimits[] = [];

  while (offset < bytes.length) {
    const id = bytes[offset++];
    const [size, next] = readVarUint32(bytes, offset);
    offset = next;
    const sectionStart = offset;
    const sectionEnd = sectionStart + size;

    if (id === 5) {
      // memory section
      let pos = sectionStart;
      const [count, afterCount] = readVarUint32(bytes, pos);
      pos = afterCount;

      for (let i = 0; i < count && pos < sectionEnd; i++) {
        const [flags, afterFlags] = readVarUint32(bytes, pos);
        pos = afterFlags;

        const [min, afterMin] = readVarUint32(bytes, pos);
        pos = afterMin;

        let max: number | null = null;
        if (flags & 0x1) {
          const [maxVal, afterMax] = readVarUint32(bytes, pos);
          pos = afterMax;
          max = maxVal;
        }

        memories.push({
          minPages: min,
          maxPages: max,
          minBytes: min * PAGE_SIZE,
          maxBytes: max != null ? max * PAGE_SIZE : null,
        });
      }
      break;
    } else {
      offset = sectionEnd;
    }
  }

  return memories;
}

// wasm_inspect - inspect a .wasm file: exports/imports, size, memory limits

export const inspect = tool({
  description: "Inspect a WebAssembly .wasm file: size, exports, imports, and memory limits (parsed from the binary).",
  args: {
    path: tool.schema.string().describe("Path to the .wasm file to inspect"),
  },
  async execute(args) {
    const file = Bun.file(args.path);
    const exists = await file.exists();
    if (!exists) {
      return JSON.stringify({
        tool: "wasm_inspect",
        path: args.path,
        exists: false,
        error: "File not found",
      });
    }

    const sizeBytes = file.size;
    const bytes = new Uint8Array(await file.arrayBuffer());

    let wasmValid = false;
    let exportsInfo: { name: string; kind: string }[] = [];
    let importsInfo: { module: string; name: string; kind: string }[] = [];

    try {
      const mod = new WebAssembly.Module(bytes);
      wasmValid = true;

      exportsInfo = WebAssembly.Module.exports(mod).map((e) => ({
        name: e.name,
        kind: e.kind,
      }));

      importsInfo = WebAssembly.Module.imports(mod).map((i) => ({
        module: i.module,
        name: i.name,
        kind: i.kind,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        tool: "wasm_inspect",
        path: args.path,
        exists: true,
        sizeBytes,
        wasmValid: false,
        error: message,
      });
    }

    const memories = parseMemoryLimits(bytes);

    return JSON.stringify({
      tool: "wasm_inspect",
      path: args.path,
      exists: true,
      sizeBytes,
      wasmValid,
      exports: exportsInfo,
      imports: importsInfo,
      memories,
      note: "Memory min/max parsed from WASM binary section 5.",
    });
  },
});

// wasm_benchmark - micro-benchmark for exported WASM functions

export const benchmark = tool({
  description:
    "Quick micro-benchmark for exported WASM functions. Loads modules, calls exports in a tight loop, measures wall time.",
  args: {
    cases: tool.schema
      .array(
        tool.schema.object({
          label: tool.schema.string().describe("Label for this benchmark case"),
          path: tool.schema.string().describe("Path to .wasm file"),
          exportName: tool.schema
            .string()
            .describe("Name of the exported function to call repeatedly"),
          iterations: tool.schema
            .number()
            .int()
            .positive()
            .default(100_000)
            .describe("How many times to call the function"),
        }),
      )
      .min(1)
      .describe("List of benchmark cases"),
  },
  async execute(args) {
    const results: Array<{
      label: string;
      path: string;
      exportName?: string;
      iterations?: number;
      totalMs?: number;
      nsPerCall?: number;
      error?: string;
    }> = [];

    for (const c of args.cases) {
      const file = Bun.file(c.path);
      const exists = await file.exists();
      if (!exists) {
        results.push({
          label: c.label,
          path: c.path,
          error: "File not found",
        });
        continue;
      }

      const bytes = await file.arrayBuffer();
      let instance: WebAssembly.Instance;
      try {
        const mod = new WebAssembly.Module(bytes);
        instance = new WebAssembly.Instance(mod, {});
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({
          label: c.label,
          path: c.path,
          error: `Failed to instantiate: ${message}`,
        });
        continue;
      }

      const fn = (instance.exports as Record<string, unknown>)[c.exportName];
      if (typeof fn !== "function") {
        results.push({
          label: c.label,
          path: c.path,
          error: `Export '${c.exportName}' is not a function`,
        });
        continue;
      }

      const iterations = c.iterations ?? 100_000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        fn();
      }
      const end = performance.now();
      const ms = end - start;
      const nsPerCall = (ms * 1e6) / iterations;

      results.push({
        label: c.label,
        path: c.path,
        exportName: c.exportName,
        iterations,
        totalMs: ms,
        nsPerCall,
      });
    }

    return JSON.stringify({
      tool: "wasm_benchmark",
      cases: results,
      note: "Simple wall-clock benchmark assuming zero-arg exports. Extend for args/warmup as needed.",
    });
  },
});

// --- wasm_size: detailed size breakdown of .wasm sections ---

type SectionInfo = {
  id: number;
  name: string;
  offset: number;
  size: number;
  percentage: number;
};

function parseWasmSections(bytes: Uint8Array): SectionInfo[] {
  const sections: SectionInfo[] = [];

  if (bytes.length < 8) return sections;

  // Skip magic (4 bytes) + version (4 bytes)
  let offset = 8;

  while (offset < bytes.length) {
    const sectionId = bytes[offset++];
    const [size, next] = readVarUint32(bytes, offset);
    const sectionStart = offset;

    sections.push({
      id: sectionId,
      name: SECTION_NAMES[sectionId] ?? `unknown(${sectionId})`,
      offset: sectionStart - 1, // include the section id byte
      size: size + (next - sectionStart) + 1, // content + varint overhead + id byte
      percentage: 0, // calculated later
    });

    offset = next + size;
  }

  // Calculate percentages
  const totalSize = bytes.length;
  for (const section of sections) {
    section.percentage = (section.size / totalSize) * 100;
  }

  return sections;
}

export const size = tool({
  description:
    "Detailed size breakdown of .wasm sections (type, import, function, code, data, etc). Shows bytes and percentage for each section.",
  args: {
    path: tool.schema.string().describe("Path to the .wasm file to analyze"),
  },
  async execute(args) {
    const file = Bun.file(args.path);
    const exists = await file.exists();
    if (!exists) {
      return JSON.stringify({
        tool: "wasm_size",
        path: args.path,
        exists: false,
        error: "File not found",
      });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Validate magic number
    const magic = bytes.slice(0, 4);
    const expectedMagic = new Uint8Array([0x00, 0x61, 0x73, 0x6d]); // \0asm
    const isMagicValid = magic.every((b, i) => b === expectedMagic[i]);

    if (!isMagicValid) {
      return JSON.stringify({
        tool: "wasm_size",
        path: args.path,
        exists: true,
        error: "Not a valid WASM file (invalid magic number)",
      });
    }

    const version = new DataView(bytes.buffer).getUint32(4, true);
    const sections = parseWasmSections(bytes);

    // Calculate header size (8 bytes for magic + version)
    const headerSize = 8;

    // Summary by section type
    const sectionSummary = sections.map((s) => ({
      name: s.name,
      bytes: s.size,
      percent: `${s.percentage.toFixed(1)}%`,
    }));

    // Find largest section
    const largestSection = sections.reduce(
      (max, s) => (s.size > max.size ? s : max),
      sections[0] ?? { name: "none", size: 0 },
    );

    return JSON.stringify({
      tool: "wasm_size",
      path: args.path,
      totalBytes: bytes.length,
      totalKB: (bytes.length / 1024).toFixed(2),
      version,
      headerBytes: headerSize,
      sectionCount: sections.length,
      sections: sectionSummary,
      largestSection: largestSection
        ? {
          name: largestSection.name,
          bytes: largestSection.size,
          percent: `${largestSection.percentage.toFixed(1)}%`,
        }
        : null,
    });
  },
});
