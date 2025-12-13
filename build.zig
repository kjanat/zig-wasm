const std = @import("std");

pub fn build(b: *std.Build) void {
    const optimize = b.standardOptimizeOption(.{});

    // Fixed wasm target for all modules
    const wasm_target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag = .freestanding,
    });

    inline for (.{ "crypto", "hash", "compress", "base64", "math" }) |name| {
        buildWasmModule(b, name, wasm_target, optimize);
    }
}

fn buildWasmModule(
    b: *std.Build,
    comptime name: []const u8,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
) void {
    const module = b.createModule(.{
        .root_source_file = b.path(b.fmt("zig/src/{s}.zig", .{name})),
        .target = target,
        .optimize = optimize,
    });

    const exe = b.addExecutable(.{
        .name = name,
        .root_module = module, // preferred root_module API in 0.14+
    });

    // WASM-tuning: library-style module, no _start, export all Zig `export` fns
    exe.export_memory = true;
    exe.initial_memory = 32 * 65536; // 2 MiB
    exe.max_memory = 256 * 65536; // 16 MiB
    exe.entry = .disabled; // `-fno-entry` equivalent
    exe.rdynamic = true; // export all symbols

    // Install directly to ../packages/<name>/dist/<name>.wasm
    const install = b.addInstallArtifact(exe, .{
        .dest_dir = .{
            .override = .{
                .custom = b.fmt("../packages/{s}/dist", .{name}),
            },
        },
        // basename not set: Zig picks the right .wasm name from the artifact
    });

    // `zig build` / `zig build install`
    b.getInstallStep().dependOn(&install.step);

    // Per-module step: `zig build crypto`, `zig build hash`, ...
    const step = b.step(name, b.fmt("Build {s} WASM module", .{name}));
    step.dependOn(&install.step);
}
