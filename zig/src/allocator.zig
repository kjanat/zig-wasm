///! Shared allocator for WASM exports
///! Provides alloc/free functions that can be called from JavaScript
const std = @import("std");

/// WASM page allocator - uses WebAssembly memory.grow
const wasm_allocator = std.heap.wasm_allocator;

/// Get the allocator for use in Zig code
pub fn getAllocator() std.mem.Allocator {
    return wasm_allocator;
}

/// Allocate memory from JavaScript
/// Returns pointer to allocated memory, or 0 on failure
pub fn alloc(size: usize) ?[*]u8 {
    const slice = wasm_allocator.alloc(u8, size) catch return null;
    return slice.ptr;
}

/// Free memory allocated by alloc
pub fn free(ptr: [*]u8, size: usize) void {
    const slice = ptr[0..size];
    wasm_allocator.free(slice);
}

/// Reallocate memory
pub fn realloc(ptr: ?[*]u8, old_size: usize, new_size: usize) ?[*]u8 {
    if (ptr) |p| {
        const old_slice = p[0..old_size];
        const new_slice = wasm_allocator.realloc(old_slice, new_size) catch return null;
        return new_slice.ptr;
    } else {
        return alloc(new_size);
    }
}
