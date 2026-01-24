//! Shared memory allocator for WASM modules.
//!
//! This module provides memory allocation functions that can be called from
//! JavaScript to manage memory in the WASM linear memory space. It uses the
//! WebAssembly page allocator (`std.heap.wasm_allocator`) which grows memory
//! via `memory.grow` instructions.
//!
//! All other WASM modules (crypto, hash, base64, etc.) re-export these functions
//! to provide a consistent allocation interface.

const std = @import("std");

/// WASM page allocator - uses WebAssembly `memory.grow` for allocation.
const wasm_allocator = std.heap.wasm_allocator;

/// Returns the WASM allocator for use within Zig code.
/// Use this when you need an `std.mem.Allocator` interface.
pub fn getAllocator() std.mem.Allocator {
    return wasm_allocator;
}

/// Allocates `size` bytes of memory from the WASM linear memory.
///
/// This function is intended to be called from JavaScript to allocate
/// memory that will be written to or read from by WASM functions.
///
/// Returns a pointer to the allocated memory, or null if allocation fails.
/// The returned pointer is valid until `free` is called with the same
/// pointer and size.
pub fn alloc(size: usize) ?[*]u8 {
    const slice = wasm_allocator.alloc(u8, size) catch return null;
    return slice.ptr;
}

/// Frees memory previously allocated by `alloc`.
///
/// The `ptr` and `size` must exactly match a previous call to `alloc`.
/// After calling `free`, the memory should not be accessed.
pub fn free(ptr: [*]u8, size: usize) void {
    const slice = ptr[0..size];
    wasm_allocator.free(slice);
}

/// Reallocates memory to a new size.
///
/// If `ptr` is null, this behaves like `alloc(new_size)`.
/// If `new_size` is larger, the additional memory is uninitialized.
/// If `new_size` is smaller, the excess memory is freed.
///
/// Returns a pointer to the reallocated memory, or null if reallocation fails.
/// On failure, the original memory remains valid.
pub fn realloc(ptr: ?[*]u8, old_size: usize, new_size: usize) ?[*]u8 {
    if (ptr) |p| {
        const old_slice = p[0..old_size];
        const new_slice = wasm_allocator.realloc(old_slice, new_size) catch return null;
        return new_slice.ptr;
    } else {
        return alloc(new_size);
    }
}
