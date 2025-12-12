///! Non-cryptographic hash functions for WASM export
///! Wraps Zig's std.hash module
const std = @import("std");
const allocator_mod = @import("allocator.zig");

// Re-export allocator functions
export fn alloc(size: usize) ?[*]u8 {
    return allocator_mod.alloc(size);
}
export fn free(ptr: [*]u8, size: usize) void {
    allocator_mod.free(ptr, size);
}

// ============================================================================
// CRC32 (IEEE polynomial)
// ============================================================================

const Crc32 = std.hash.crc.Crc32;

/// Calculate CRC32 checksum
export fn crc32(data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return Crc32.hash(data);
}

// ============================================================================
// Adler32
// ============================================================================

const Adler32 = std.hash.Adler32;

/// Calculate Adler32 checksum
export fn adler32(data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return Adler32.hash(data);
}

// ============================================================================
// XxHash64
// ============================================================================

const XxHash64 = std.hash.XxHash64;

/// Calculate XxHash64
export fn xxhash64(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return XxHash64.hash(0, data);
}

/// Calculate XxHash64 with seed
export fn xxhash64_seeded(seed: u64, data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return XxHash64.hash(seed, data);
}

// ============================================================================
// XxHash32
// ============================================================================

const XxHash32 = std.hash.XxHash32;

/// Calculate XxHash32
export fn xxhash32(data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return XxHash32.hash(0, data);
}

/// Calculate XxHash32 with seed
export fn xxhash32_seeded(seed: u32, data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return XxHash32.hash(seed, data);
}

// ============================================================================
// Wyhash
// ============================================================================

const Wyhash = std.hash.Wyhash;

/// Calculate Wyhash
export fn wyhash(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Wyhash.hash(0, data);
}

/// Calculate Wyhash with seed
export fn wyhash_seeded(seed: u64, data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Wyhash.hash(seed, data);
}

// ============================================================================
// CityHash64
// ============================================================================

const CityHash64 = std.hash.CityHash64;

/// Calculate CityHash64
export fn cityhash64(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return CityHash64.hash(data);
}

/// Calculate CityHash64 with seed
export fn cityhash64_seeded(seed: u64, data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return CityHash64.hashWithSeed(data, seed);
}

// ============================================================================
// Murmur Hash (v2, 64-bit)
// ============================================================================

const Murmur2_64 = std.hash.Murmur2_64;

/// Calculate MurmurHash2 64-bit
export fn murmur2_64(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Murmur2_64.hash(data);
}

/// Calculate MurmurHash2 64-bit with seed
export fn murmur2_64_seeded(seed: u64, data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Murmur2_64.hashWithSeed(data, seed);
}

// ============================================================================
// Fnv1a (64-bit)
// ============================================================================

const Fnv1a_64 = std.hash.Fnv1a_64;

/// Calculate FNV-1a 64-bit hash
export fn fnv1a_64(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Fnv1a_64.hash(data);
}

// ============================================================================
// Fnv1a (32-bit)
// ============================================================================

const Fnv1a_32 = std.hash.Fnv1a_32;

/// Calculate FNV-1a 32-bit hash
export fn fnv1a_32(data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return Fnv1a_32.hash(data);
}
