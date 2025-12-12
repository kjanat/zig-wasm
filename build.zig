const std = @import("std");

pub fn build(b: *std.Build) void {
    const optimize = b.standardOptimizeOption(.{});

    // Build all WASM modules
    buildWasmModule(b, "crypto", optimize);
    buildWasmModule(b, "hash", optimize);
    buildWasmModule(b, "compress", optimize);
    buildWasmModule(b, "base64", optimize);
    buildWasmModule(b, "math", optimize);
}

fn buildWasmModule(
    b: *std.Build,
    name: []const u8,
    optimize: std.builtin.OptimizeMode,
) void {
    const source_file = b.path(b.fmt("zig/src/{s}.zig", .{name}));

    const lib = b.addExecutable(.{
        .name = name,
        .root_module = b.createModule(.{
            .root_source_file = source_file,
            .target = b.resolveTargetQuery(.{
                .cpu_arch = .wasm32,
                .os_tag = .freestanding,
            }),
            .optimize = optimize,
        }),
    });

    // Export memory
    lib.export_memory = true;

    // Set initial memory (2MB = 32 pages of 64KB each)
    lib.initial_memory = 32 * 65536;

    // Allow memory growth
    lib.max_memory = 256 * 65536; // 16MB max

    // Don't need entry point
    lib.entry = .disabled;

    // Export all public symbols (functions marked with `export`)
    lib.rdynamic = true;

    // Install to packages/<name>/dist/<name>.wasm
    const install = b.addInstallArtifact(lib, .{
        .dest_dir = .{ .override = .{ .custom = b.fmt("packages/{s}/dist", .{name}) } },
    });

    b.getInstallStep().dependOn(&install.step);

    // Individual build step for this module
    const build_step = b.step(name, b.fmt("Build {s} WASM module", .{name}));
    build_step.dependOn(&install.step);
}
