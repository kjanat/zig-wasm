/// <reference types="bun-types" />
/// <reference types="@opencode-ai/plugin" />
import { tool } from "@opencode-ai/plugin";

// ---------- test: run zig tests ----------

export const test = tool({
  description:
    "Run Zig tests. Either `zig test <file>` or `zig build <step>` (default: test). Returns stdout/stderr/exitCode.",
  args: {
    mode: tool.schema
      .enum(["file", "build"])
      .describe("file: run `zig test <file>`; build: run `zig build <step>`")
      .default("build"),
    file: tool.schema
      .string()
      .optional()
      .describe("Path to a Zig file when mode = 'file'"),
    step: tool.schema
      .string()
      .optional()
      .default("test")
      .describe("Build step to run when mode = 'build', e.g. 'test'"),
  },
  async execute(args) {
    if (args.mode === "file") {
      if (!args.file) {
        throw new Error("file is required when mode = 'file'");
      }
      const proc = Bun.spawn(["zig", "test", args.file], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      const exitCode = await proc.exited;

      return JSON.stringify({
        tool: "zig_test",
        mode: "file",
        command: `zig test ${args.file}`,
        file: args.file,
        exitCode,
        ok: exitCode === 0,
        stdout,
        stderr,
      });
    }

    // mode === "build"
    const step = args.step ?? "test";
    const proc = Bun.spawn(["zig", "build", step], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    return JSON.stringify({
      tool: "zig_test",
      mode: "build",
      command: `zig build ${step}`,
      step,
      exitCode,
      ok: exitCode === 0,
      stdout,
      stderr,
    });
  },
});

// ---------- fmt: format Zig code ----------

export const fmt = tool({
  description:
    "Format Zig code using `zig fmt`. Supports formatting a file in-place or formatting a snippet via stdin.",
  args: {
    mode: tool.schema
      .enum(["file", "snippet"])
      .describe("file: run `zig fmt <path>`; snippet: format provided code via stdin")
      .default("file"),
    path: tool.schema
      .string()
      .optional()
      .describe("Path to .zig file when mode = 'file'"),
    code: tool.schema
      .string()
      .optional()
      .describe("Zig source code when mode = 'snippet'"),
  },
  async execute(args) {
    if (args.mode === "file") {
      if (!args.path) {
        throw new Error("path is required when mode = 'file'");
      }

      const proc = Bun.spawn(["zig", "fmt", args.path], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);
      const exitCode = await proc.exited;

      let formatted: string | null = null;
      try {
        formatted = await Bun.file(args.path).text();
      } catch {
        // file read failed, still return formatter output
      }

      return JSON.stringify({
        tool: "zig_fmt",
        mode: "file",
        command: `zig fmt ${args.path}`,
        path: args.path,
        exitCode,
        ok: exitCode === 0,
        stdout,
        stderr,
        formatted,
      });
    }

    // mode === "snippet" - use stdin
    if (!args.code) {
      throw new Error("code is required when mode = 'snippet'");
    }

    const proc = Bun.spawn(["zig", "fmt", "--stdin"], {
      stdin: new TextEncoder().encode(args.code),
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    return JSON.stringify({
      tool: "zig_fmt",
      mode: "snippet",
      command: "zig fmt --stdin",
      exitCode,
      ok: exitCode === 0,
      stdout,
      stderr,
      formatted: exitCode === 0 ? stdout : null,
    });
  },
});

// ---------- stdlib: lightweight Zig std search (no broken JSON fetch) ----------

type StdItem = {
  name: string;
  kind: "namespace" | "type" | "function";
  description: string;
};

const mdCodefence = (code: string, lang: string | null = "zig") => {
  return `${"```"}${lang ?? ""}\n${code}\n${"```"}`;
};

const mdCode = (code: string) => {
  return `\`${code}\``;
};

const STD_ITEMS: StdItem[] = [
  {
    name: "std.mem",
    kind: "namespace",
    description: "Slices, copying, searching, equality, byte utilities; core []T helpers.",
  },
  {
    name: "std.heap",
    kind: "namespace",
    description: "Allocators (DebugAllocator, wasm_allocator, ArenaAllocator, etc).",
  },
  {
    name: "std.ArrayList",
    kind: "type",
    description: "Resizable array backed by an allocator; append/pop, etc.",
  },
  {
    name: "std.AutoArrayHashMap",
    kind: "type",
    description: "Hash map that owns its own backing memory via an allocator.",
  },
  {
    name: "std.StringHashMap",
    kind: "type",
    description: "Hash map keyed by strings; great for small-ish maps, configs, etc.",
  },
  {
    name: "std.fs",
    kind: "namespace",
    description: "Filesystem access: opening files, dirs, reading/writing, paths.",
  },
  {
    name: "std.io",
    kind: "namespace",
    description: "Buffered I/O, readers/writers, stdin/stdout, streaming interfaces.",
  },
  {
    name: "std.net",
    kind: "namespace",
    description: "TCP/UDP sockets, networking utilities.",
  },
  {
    name: "std.fmt",
    kind: "namespace",
    description: "Formatting into slices/allocators; print-style functions.",
  },
  {
    name: "std.crypto",
    kind: "namespace",
    description: "Hashing, AEAD, key derivation, random bytes, etc.",
  },
  {
    name: "std.hash",
    kind: "namespace",
    description: "Hash functions (e.g. Wyhash, CRC, SHA wrappers).",
  },
  {
    name: "std.math",
    kind: "namespace",
    description: "Math utilities: trig, pow, clamping, floats/ints helpers.",
  },
  {
    name: "std.rand",
    kind: "namespace",
    description: "Random number generators, seeds, distributions.",
  },
  {
    name: "std.time",
    kind: "namespace",
    description: "Timestamps, timers, durations, sleep, clocks.",
  },
  {
    name: "std.process",
    kind: "namespace",
    description: "Spawning processes, argv/env, exit codes.",
  },
  {
    name: "std.testing",
    kind: "namespace",
    description: "Testing helpers, test allocator, failing allocator.",
  },
  {
    name: "std.wasm",
    kind: "namespace",
    description: "Low-level wasm page/memory helpers and intrinsics.",
  },
  {
    name: "std.json",
    kind: "namespace",
    description: "JSON parsing/printing; DOM-style and streaming APIs.",
  },
  {
    name: "std.log",
    kind: "namespace",
    description: "Logging with compile-time log levels and scopes.",
  },
];

function scoreStdItem(q: string, item: StdItem): number {
  const query = q.toLowerCase();
  const name = item.name.toLowerCase();
  const desc = item.description.toLowerCase();

  let score = 0;
  if (name === query) score += 5;
  else if (name.includes(query)) score += 3;
  if (desc.includes(query)) score += 2;
  return score;
}

export const stdlib = tool({
  description: "Quick Zig stdlib helper. Use for 'where the hell is X in std', allocators, collections, etc.",
  args: {
    query: tool.schema
      .string()
      .describe("Search term like 'ArrayList', 'heap', 'wasm', 'json', 'hash', ..."),
  },
  async execute(args) {
    const url = "https://ziglang.org/documentation/master/std/";

    const raw = args.query.trim();
    if (raw.length === 0) {
      const top = STD_ITEMS.slice(0, 10);
      const list = top
        .map(
          (i) => `- **${i.name}** (${i.kind}) — ${i.description}`,
        )
        .join("\n");

      return `# Zig stdlib overview

Base docs: ${url}

You gave an empty query, so here's a small tour of the usual suspects:

${list}

Open the docs and hit ${mdCode("s")} to search for the symbol name, e.g. ${mdCode("mem")}, ${mdCode("heap")}, ${
        mdCode("ArrayList")
      }.`;
    }

    const matches = STD_ITEMS.map((item) => ({
      item,
      score: scoreStdItem(raw, item),
    }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.item);

    if (matches.length === 0) {
      return `# Zig stdlib search

Base docs: ${url}

Couldn't find anything obvious for ${mdCode(raw)} in the small built-in index.

Tips:
- Try a more generic term (e.g. ${mdCode("heap")} instead of ${mdCode("WasmAllocator")})
- Open ${url} and press ${mdCode("s")} to use the official search UI`;
    }

    const list = matches
      .map(
        (i) => `- **${i.name}** (${i.kind}) — ${i.description}`,
      )
      .join("\n");

    return `# Zig stdlib search

Base docs: ${url}

Matches for ${mdCode(raw)}:

${list}

Open the docs and press ${mdCode("s")}, then type the symbol (e.g. ${mdCode("mem")}, ${mdCode("heap")}, ${
      mdCode("ArrayList")
    }) to jump to details.`;
  },
});

// ---------- build: Zig build system / build.zig helpers ----------

export const build = tool({
  description:
    "Zig build system cheatsheet. Use for build.zig APIs, WASM targets, cross-compilation, steps, install, etc.",
  args: {
    topic: tool.schema
      .enum([
        "general",
        "wasm",
        "addExecutable",
        "addSharedLibrary",
        "createModule",
        "targets",
        "options",
        "steps",
        "install",
      ])
      .describe("Build topic to show docs for."),
  },
  async execute(args) {
    const docs: Record<string, string> = {
      general: `# Zig build.zig – mental model

- ${mdCode("pub fn build(b: *std.Build) void")} is the entrypoint for ${mdCode("zig build")}.
- You create **artifacts** (executables, libraries, tests) with things like ${mdCode("b.addExecutable")}.
- You wire them into **steps** (${mdCode("b.installArtifact")}, custom steps via ${mdCode("b.step")}).
- Running ${mdCode("zig build")} executes the default step (usually ${mdCode("b.getInstallStep()")} or ${
        mdCode("b.default_step")
      }).

Basic hello world executable:

${
        mdCodefence(`const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const main_mod = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    const exe = b.addExecutable(.{
        .name = "hello",
        .root_module = main_mod,
    });

    b.installArtifact(exe);
}`)
      }

Then:

- ${mdCode("zig build")} – builds and installs to ${mdCode("zig-out/bin/hello")}
- ${mdCode("zig build -Doptimize=ReleaseFast")} – same, but release mode
- ${mdCode("zig build --help")} – see all options and custom steps
`,

      wasm: `# WASM build (wasm32-freestanding)

Typical pattern for a WASM library:

${
        mdCodefence(`const std = @import("std");

fn buildWasmModule(
    b: *std.Build,
    name: []const u8,
    source: []const u8,
    optimize: std.builtin.OptimizeMode,
) void {
    const wasm_target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag = .freestanding,
    });

    const mod = b.createModule(.{
        .root_source_file = b.path(source),
        .target = wasm_target,
        .optimize = optimize,
    });

    const lib = b.addExecutable(.{
        .name = name,
        .root_module = mod,
    });

    // Use as a WASM "lib", not a main()
    lib.entry = .disabled;

    // Export memory + allow JS to see exported functions
    lib.export_memory = true;
    lib.rdynamic = true;

    // Memory in bytes (WebAssembly pages are 64 KiB)
    lib.initial_memory = 32 * 65536; // 2 MiB
    lib.max_memory = 256 * 65536;    // 16 MiB

    // Install to zig-out by default
    b.installArtifact(lib);
}`)
      }

For your project you can wrap this in a loop and call it for ${mdCode("crypto")}, ${mdCode("hash")}, ${
        mdCode("base64")
      }, etc.

Notes:

- Use ${mdCode("std.heap.wasm_allocator")} inside the WASM module for heap allocations.
- Avoid ${mdCode("std.fs")}, ${mdCode("std.net")}, and most ${mdCode("std.os")} stuff on ${
        mdCode(".freestanding")
      } – there is no OS.
`,

      addExecutable: `# b.addExecutable – modern (0.14+) usage

Always go through a ${mdCode("std.Build.Module")} from ${mdCode("b.createModule")}:

${
        mdCodefence(`const exe_mod = b.createModule(.{
    .root_source_file = b.path("src/main.zig"),
    .target = target,
    .optimize = optimize,
});

const exe = b.addExecutable(.{
    .name = "my-app",
    .root_module = exe_mod,
});

b.installArtifact(exe);`)
      }

Why:

- Future-proof: direct ${mdCode(".root_source_file")} on ${mdCode("addExecutable")} is deprecated.
- You can **reuse** the same module for tests, benchmarks, etc.
- Cleaner when you start adding imports and extra modules.

For tests:

${
        mdCodefence(`const test_mod = b.createModule(.{
    .root_source_file = b.path("src/main.zig"),
    .target = target,
    .optimize = optimize,
});

const tests = b.addTest(.{
    .root_module = test_mod,
});

const run_tests = b.addRunArtifact(tests);
b.getInstallStep().dependOn(&run_tests.step);`)
      }
`,

      addSharedLibrary: `# b.addSharedLibrary – dynamic libraries

Basic pattern (non-WASM):

${
        mdCodefence(`const lib_mod = b.createModule(.{
    .root_source_file = b.path("src/lib.zig"),
    .target = target,
    .optimize = optimize,
});

const lib = b.addSharedLibrary(.{
    .name = "mylib",
    .root_module = lib_mod,
    .version = .{ .major = 1, .minor = 0, .patch = 0 },
});

b.installArtifact(lib);`)
      }

Use this when you actually need a platform native shared library (dll/so/dylib).
For WebAssembly use ${mdCode("addExecutable")} like in the WASM snippet, not ${mdCode("addSharedLibrary")}.
`,

      createModule: `# b.createModule – building a module graph

${
        mdCodefence(`const core_mod = b.createModule(.{
    .root_source_file = b.path("src/core.zig"),
    .target = target,
    .optimize = optimize,
});

const cli_mod = b.createModule(.{
    .root_source_file = b.path("src/main.zig"),
    .target = target,
    .optimize = optimize,
});

// Make ${"`core`"} importable as ${"`@import(\"core\")`"}
cli_mod.addImport("core", core_mod);

const exe = b.addExecutable(.{
    .name = "my-app",
    .root_module = cli_mod,
});

b.installArtifact(exe);`)
      }

Key points:

- One ${mdCode("std.Build.Module")} per logical module of your project.
- You can add imports between modules with ${mdCode("addImport(name, module)")}.
- The same module can back an executable, tests, or other libs.
`,

      targets: `# Targets – choosing where to build for

Let the person running ${mdCode("zig build")} choose:

${mdCodefence(`const target = b.standardTargetOptions(.{});`)}

For a fixed target (e.g. wasm32-freestanding):

${
        mdCodefence(`const wasm_target = b.resolveTargetQuery(.{
    .cpu_arch = .wasm32,
    .os_tag = .freestanding,
});`)
      }

Mixing both:

${
        mdCodefence(`const target = b.standardTargetOptions(.{
    .default_target = .{
        .cpu_arch = .x86_64,
        .os_tag = .linux,
    },
});`)
      }

Typical WASM choices:

- ${mdCode(".wasm32")} + ${mdCode(".freestanding")} – browser / JS runtime with custom host.
- ${mdCode(".wasm32")} + ${mdCode(".wasi")} – WASI runtimes (wasmtime, wasmer, wazero, etc).
`,

      options: `# Optimize modes and build options

The standard CLI-driven pattern:

${
        mdCodefence(`const optimize = b.standardOptimizeOption(.{});
// allows: -Doptimize=Debug / ReleaseSafe / ReleaseFast / ReleaseSmall`)
      }

You can also hard-code:

${
        mdCodefence(`const exe_mod = b.createModule(.{
    .root_source_file = b.path("src/main.zig"),
    .target = target,
    .optimize = .ReleaseFast,
});`)
      }

Other handy options on artifacts:

${
        mdCodefence(`const exe = b.addExecutable(.{
    .name = "my-app",
    .root_module = exe_mod,
    .version = .{ .major = 1, .minor = 2, .patch = 3 },
});

// WASM-only knobs
exe.export_memory = true;
exe.initial_memory = 32 * 65536;
exe.max_memory = 256 * 65536;
exe.entry = .disabled;
exe.rdynamic = true;`)
      }
`,

      steps: `# Steps – custom build targets

Create a new step:

${
        mdCodefence(`const run_step = b.step("run", "Build and run the app");

// Assume exe defined earlier
const run_artifact = b.addRunArtifact(exe);
run_step.dependOn(&run_artifact.step);`)
      }

Then from the shell:

- ${mdCode("zig build run")} – builds + runs the executable.
- ${mdCode("zig build")} – still does the default install step unless you change it.

You can chain steps:

${
        mdCodefence(`const fmt_step = b.step("fmt", "Run zig fmt");
fmt_step.makeFn = struct {
    fn make(step: *std.Build.Step, prog_node: *std.Progress.Node) anyerror!void {
        _ = prog_node;
        const b = step.owner;
        try b.spawnChild(&.{"zig", "fmt", "src"}, .{});
    }
}.make;

run_step.dependOn(fmt_step);`)
      }

Now ${mdCode("zig build run")} will also run your format step first.
`,

      install: `# Installing artifacts – where binaries end up

Most of the time you just call:

${mdCodefence(`b.installArtifact(exe);`)}

That:

- Builds the executable
- Puts it under ${mdCode("zig-out/bin/")}
- Wires it into the default install step used by ${mdCode("zig build")}

For custom locations (common with WASM):

${
        mdCodefence(`const install = b.addInstallFileWithDir(
    lib.getEmittedBin(),                 // the .wasm file
    .{ .custom = "../packages/crypto/dist" },
    "crypto.wasm",
);

b.getInstallStep().dependOn(&install.step);`)
      }

Then:

- ${mdCode("zig build")} puts the wasm at ${mdCode("../packages/crypto/dist/crypto.wasm")}
- You can also expose this via a named step and run ${mdCode("zig build crypto")} if you want per-module build targets.
`,
    };

    return docs[args.topic] ?? "Unknown topic";
  },
});

// ---------- wasm_memory: how to deal with memory between Zig WASM & JS ----------

export const wasm_memory = tool({
  description: "Zig WASM memory patterns: std.heap.wasm_allocator, passing slices/strings to/from JS, memory sizing.",
  args: {},
  async execute() {
    return `# Zig WASM memory patterns

## Allocator choice

For ${mdCode("wasm32-freestanding")} or ${mdCode("wasm32-wasi")} without an OS, use the dedicated allocator:

${
      mdCodefence(`const std = @import("std");

const allocator = std.heap.wasm_allocator;`)
    }

It talks directly to WASM memory via ${mdCode("memory.grow")} and is much better than ${
      mdCode("page_allocator")
    } in this context.

## Exporting memory

In your build script (for a WASM target):

${
      mdCodefence(`lib.export_memory = true;
lib.initial_memory = 32 * 65536; // 2 MiB
lib.max_memory = 256 * 65536;    // 16 MiB`)
    }

On the JS side (Node / Bun / browser):

${
      mdCodefence(
        `const { instance } = await WebAssembly.instantiate(bytes, { env: { /* imports */ } })

const memory = instance.exports.memory as WebAssembly.Memory
const view = new Uint8Array(memory.buffer)`,
        "ts",
      )
    }

## Exporting alloc/free for JS

Minimal pattern for "JS owns the string but allocates in WASM":

${
      mdCodefence(`const std = @import("std");
const allocator = std.heap.wasm_allocator;

export fn alloc(len: u32) [*]u8 {
    const slice = allocator.alloc(u8, len) catch @panic("oom");
    return slice.ptr;
}

export fn free(ptr: [*]u8, len: u32) void {
    const slice = ptr[0..len];
    allocator.free(slice);
}`)
    }

JS side:

${
      mdCodefence(
        `const { memory, alloc, free } = instance.exports as {
  memory: WebAssembly.Memory
  alloc(len: number): number
  free(ptr: number, len: number): void
}

function writeBytes(data: Uint8Array): number {
  const ptr = alloc(data.length)
  const view = new Uint8Array(memory.buffer, ptr, data.length)
  view.set(data)
  return ptr
}

function readBytes(ptr: number, len: number): Uint8Array {
  return new Uint8Array(memory.buffer, ptr, len)
}`,
        "ts",
      )
    }

## Passing strings JS -> Zig

Export a function that takes a null-terminated pointer:

${
      mdCodefence(`const std = @import("std");
const allocator = std.heap.wasm_allocator;

export fn hello(name: [*:0]const u8) void {
    const slice = std.mem.span(name); // convert to []const u8
    std.debug.print("Hello, {s}\\n", .{slice});
}`)
    }

JS side:

${
      mdCodefence(
        `function utf8ToCString(str: string): number {
  const enc = new TextEncoder().encode(str)
  const ptr = alloc(enc.length + 1)
  const view = new Uint8Array(memory.buffer, ptr, enc.length + 1)
  view.set(enc)
  view[enc.length] = 0 // null terminator
  return ptr
}

const ptr = utf8ToCString("world")
hello(ptr)
free(ptr, "world".length + 1)`,
        "ts",
      )
    }

## Passing strings Zig -> JS

Return pointer + length, let JS slice the memory:

${
      mdCodefence(`export fn get_msg(ptr_out: *[*]const u8, len_out: *usize) void {
    const msg = "Hello from Zig!";
    ptr_out.* = msg.ptr;
    len_out.* = msg.len;
}`)
    }

JS:

${
      mdCodefence(
        `const ptrOut = new Uint32Array(memory.buffer, ptr_buf, 1)
const lenOut = new Uint32Array(memory.buffer, len_buf, 1)

// after calling get_msg(...)
const ptr = ptrOut[0]
const len = lenOut[0]
const bytes = new Uint8Array(memory.buffer, ptr, len)
const text = new TextDecoder().decode(bytes)`,
        "ts",
      )
    }

Key idea: **WASM memory is just a big byte buffer**. You pass indices + lengths around; both Zig and JS agree on the layout.
`;
  },
});

// ---------- docs: generate Zig documentation ----------

export const docs = tool({
  description:
    "Generate documentation for a Zig file or module. Uses `zig build-lib -femit-docs` to generate HTML docs.",
  args: {
    path: tool.schema.string().describe("Path to the .zig file to document"),
    outputDir: tool.schema
      .string()
      .default("./zig-docs")
      .describe("Output directory for generated docs (default: ./zig-docs)"),
  },
  async execute(args) {
    const outDir = args.outputDir ?? "./zig-docs";

    // Use zig build-lib with -femit-docs
    const proc = Bun.spawn(
      ["zig", "build-lib", args.path, `-femit-docs=${outDir}`, "-fno-emit-bin"],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    // Check if docs were generated
    const indexPath = `${outDir}/index.html`;
    const indexFile = Bun.file(indexPath);
    const indexExists = await indexFile.exists();

    return JSON.stringify({
      tool: "zig_docs",
      command: `zig build-lib ${args.path} -femit-docs=${outDir} -fno-emit-bin`,
      path: args.path,
      outputDir: outDir,
      exitCode,
      ok: exitCode === 0,
      docsGenerated: indexExists,
      indexPath: indexExists ? indexPath : null,
      stdout,
      stderr,
      note: indexExists
        ? `Open ${indexPath} in a browser to view docs`
        : "Documentation may not have been generated - check stderr for errors",
    });
  },
});

// ---------- ast: parse Zig and return AST check / dump info ----------

export const ast = tool({
  description:
    "Parse Zig source and return AST info. Uses `zig ast-check` to validate syntax and dump AST structure for a file or snippet.",
  args: {
    mode: tool.schema
      .enum(["file", "snippet"])
      .describe("file: check a .zig file; snippet: check provided code via stdin")
      .default("file"),
    path: tool.schema
      .string()
      .optional()
      .describe("Path to .zig file when mode = 'file'"),
    code: tool.schema
      .string()
      .optional()
      .describe("Zig source code when mode = 'snippet'"),
    dump: tool.schema
      .boolean()
      .default(false)
      .describe("If true, also run with --dump to show AST structure"),
  },
  async execute(args) {
    if (args.mode === "file") {
      if (!args.path) {
        throw new Error("path is required when mode = 'file'");
      }

      // First run ast-check
      const checkProc = Bun.spawn(["zig", "ast-check", args.path], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const [checkStdout, checkStderr] = await Promise.all([
        new Response(checkProc.stdout).text(),
        new Response(checkProc.stderr).text(),
      ]);
      const checkExitCode = await checkProc.exited;

      const result: Record<string, unknown> = {
        tool: "zig_ast",
        mode: "file",
        command: `zig ast-check ${args.path}`,
        path: args.path,
        exitCode: checkExitCode,
        ok: checkExitCode === 0,
        stdout: checkStdout,
        stderr: checkStderr,
      };

      // If dump requested and check passed, also dump
      if (args.dump && checkExitCode === 0) {
        const dumpProc = Bun.spawn(["zig", "ast-check", "--dump", args.path], {
          stdout: "pipe",
          stderr: "pipe",
        });
        const [dumpStdout, dumpStderr] = await Promise.all([
          new Response(dumpProc.stdout).text(),
          new Response(dumpProc.stderr).text(),
        ]);
        await dumpProc.exited;
        result.dump = dumpStdout || dumpStderr;
      }

      return JSON.stringify(result);
    }

    // mode === "snippet"
    if (!args.code) {
      throw new Error("code is required when mode = 'snippet'");
    }

    const checkProc = Bun.spawn(["zig", "ast-check", "--stdin"], {
      stdin: new TextEncoder().encode(args.code),
      stdout: "pipe",
      stderr: "pipe",
    });
    const [checkStdout, checkStderr] = await Promise.all([
      new Response(checkProc.stdout).text(),
      new Response(checkProc.stderr).text(),
    ]);
    const checkExitCode = await checkProc.exited;

    const result: Record<string, unknown> = {
      tool: "zig_ast",
      mode: "snippet",
      command: "zig ast-check --stdin",
      exitCode: checkExitCode,
      ok: checkExitCode === 0,
      stdout: checkStdout,
      stderr: checkStderr,
    };

    if (args.dump && checkExitCode === 0) {
      const dumpProc = Bun.spawn(["zig", "ast-check", "--dump", "--stdin"], {
        stdin: new TextEncoder().encode(args.code),
        stdout: "pipe",
        stderr: "pipe",
      });
      const [dumpStdout, dumpStderr] = await Promise.all([
        new Response(dumpProc.stdout).text(),
        new Response(dumpProc.stderr).text(),
      ]);
      await dumpProc.exited;
      result.dump = dumpStdout || dumpStderr;
    }

    return JSON.stringify(result);
  },
});

// ---------- patterns: Zig language patterns (errors, optionals, slices, etc) ----------

export const patterns = tool({
  description: "Zig language patterns: error handling, optionals, comptime, generics, defer/errdefer, slices, structs.",
  args: {
    topic: tool.schema
      .enum(["errors", "optionals", "comptime", "generics", "defer", "slices", "structs"])
      .describe("Language pattern topic"),
  },
  async execute(args) {
    const docs: Record<string, string> = {
      errors: `# Error handling

## Error unions

${
        mdCodefence(`fn openFile(path: []const u8) !std.fs.File {
    const cwd = std.fs.cwd();
    return cwd.openFile(path, .{ .mode = .read_only });
}`)
      }

Type is ${mdCode("!T")} ("T or error"), like ${mdCode("Result<T, E>")} but built-in.

## ${mdCode("try")} + ${mdCode("catch")}

${
        mdCodefence(`fn readConfig(path: []const u8) !Config {
    const file = try openFile(path);
    defer file.close();

    // if parseConfig returns any error, bubble it up
    return try parseConfig(file);
}

fn main() !void {
    const config = try readConfig("config.json");
}`)
      }

${
        mdCodefence(`const config = readConfig("config.json") catch |err| switch (err) {
    error.NotFound => {
        std.debug.print("no config, using defaults\\n", .{});
        return defaultConfig();
    },
    else => return err,
};`)
      }

## ${mdCode("errdefer")}

${
        mdCodefence(`fn doStuff() !void {
    const handle = try acquire();
    errdefer release(handle);

    try step1(handle);
    try step2(handle);
    // if anything above errors, release() runs automatically
}`)
      }
`,

      optionals: `# Optionals

Optional type is ${mdCode("?T")} ("maybe T, maybe null").

${
        mdCodefence(`var maybe_int: ?u32 = null;

maybe_int = 42;

// if binding
if (maybe_int) |value| {
    std.debug.print("value = {d}\\n", .{value});
} else {
    std.debug.print("no value\\n", .{});
}`)
      }

Unwrapping:

${mdCodefence(`const value = maybe_int orelse 0;`)}

Null-checking with early return:

${mdCodefence(`const ptr = maybe_ptr orelse return error.MissingThing;`)}

Optionals of pointers are common:

${
        mdCodefence(`var head: ?*Node = null;

// later
const node = head orelse return;`)
      }
`,

      comptime: `# comptime

Use ${mdCode("comptime")} for stuff known at compile time.

${
        mdCodefence(`fn arrayOf(comptime T: type, n: usize) type {
    return [n]T;
}

const U32x4 = arrayOf(u32, 4);`)
      }

Compile-time loops:

${
        mdCodefence(`inline for (&[_]u8{'a', 'b', 'c'}) |ch, i| {
    std.debug.print("{d}: {c}\\n", .{ i, ch });
}`)
      }

Specializing code paths:

${
        mdCodefence(`fn doThing(comptime fast: bool) void {
    if (fast) {
        // optimized path compiled only into fast variant
    } else {
        // debug heavy checks
    }
}

pub fn main() void {
    doThing(true);  // only fast path emitted
}`)
      }
`,

      generics: `# Generics (using ${mdCode("comptime T: type")})

${
        mdCodefence(`fn max(comptime T: type, a: T, b: T) T {
    return if (a > b) a else b;
}

pub fn main() void {
    const x = max(i32, 10, 20);
    const y = max(f64, 0.5, 0.25);
}`)
      }

You can also pass functions, values, enums, etc. as comptime parameters to specialize behavior.

Pattern you'll use all the time:

${mdCodefence(`fn parse(comptime T: type, text: []const u8) !T { ... }`)}
`,

      defer: `# defer & errdefer

${mdCode("defer")} runs on every exit from the scope (success or error):

${
        mdCodefence(`fn doStuff() !void {
    const file = try std.fs.cwd().openFile("data.bin", .{});
    defer file.close();

    // ... may ${"`try`"} and error out here ...
}`)
      }

${mdCode("errdefer")} only runs when the scope exits with an error:

${
        mdCodefence(`fn transact() !void {
    try beginTransaction();
    errdefer rollbackTransaction();

    try updateRow();
    try updateOtherRow();

    try commitTransaction(); // if this succeeds, rollback is skipped
}`)
      }
`,

      slices: `# Arrays, slices, and pointers

- **Array**: ${mdCode("[N]T")} – fixed size, lives by value.
- **Slice**: ${mdCode("[]T")} or ${mdCode("[]const T")} – pointer + length, not owning.
- **Pointer**: ${mdCode("*T")} / ${mdCode("[*]T")} / ${mdCode("[*:0]T")} – raw pointer(s).

Examples:

${
        mdCodefence(`var buf: [1024]u8 = undefined;

// slice over whole buffer
const slice: []u8 = buf[0..];

// constant string literal is *const [N:0]u8
const s = "hello";          // *const [5:0]u8
const s_slice: []const u8 = s;

// C string pointer (null-terminated)
extern fn c_fn(s: [*:0]const u8) void;

// compile error: slice.ptr has no sentinel info
// const bad: [*:0]const u8 = s_slice.ptr;

// correct: ensure a sentinel exists
const c_str: [*:0]const u8 = s;`)
      }

Key takeaways:

- Use **slices** whenever you can; arrays mostly for local buffers / fixed data.
- For C / JS interop, you'll see ${mdCode("[*]T")} and ${mdCode("[*:0]T")} a lot.
`,

      structs: `# Structs and init patterns

Basic struct:

${
        mdCodefence(`const Point = struct {
    x: f32,
    y: f32,
};

const p = Point{ .x = 1.0, .y = 2.0 };`)
      }

Adding methods:

${
        mdCodefence(`const Point = struct {
    x: f32,
    y: f32,

    const Self = @This();

    pub fn init(x: f32, y: f32) Self {
        return .{ .x = x, .y = y };
    }

    pub fn length(self: Self) f32 {
        return @sqrt(self.x * self.x + self.y * self.y);
    }
};

pub fn main() void {
    const p = Point.init(3, 4);
    std.debug.print("len = {d}\\n", .{p.length()});
}`)
      }

You can also add ${
        mdCode("comptime")
      } fields, nested types, and so on – structs are the main "everything lives here" container in Zig.
`,
    };

    return docs[args.topic] ?? "Unknown topic";
  },
});
