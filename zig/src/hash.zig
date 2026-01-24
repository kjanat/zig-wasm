//! Non-cryptographic hash functions for WASM export.
//!
//! Provides fast hash functions optimized for speed over security.
//! These are suitable for hash tables, checksums, and data identification,
//! but should NOT be used for cryptographic purposes.
//!
//! **Checksums** (error detection):
//! - **CRC32**: IEEE polynomial, used in Ethernet, gzip, PNG
//! - **Adler32**: Simpler/faster than CRC32, used in zlib
//!
//! **Hash functions** (hash tables, fingerprinting):
//! - **xxHash**: Extremely fast, good distribution (32-bit and 64-bit)
//! - **wyhash**: Very fast, good quality, small code size
//! - **CityHash64**: Google's hash function, optimized for x86-64
//! - **MurmurHash2**: Popular general-purpose hash (64-bit)
//! - **FNV-1a**: Simple and fast, good for short strings (32-bit and 64-bit)
//!
//! Seeded variants allow different hash values for the same input,
//! useful for hash table randomization or bloom filters.

const std = @import("std");
const allocator_mod = @import("allocator.zig");

/// Allocates memory in WASM linear memory.
///
/// Returns a pointer to the allocated region, or null if allocation fails.
export fn alloc(size: usize) ?[*]u8 {
    return allocator_mod.alloc(size);
}

/// Frees previously allocated WASM memory.
export fn free(ptr: [*]u8, size: usize) void {
    allocator_mod.free(ptr, size);
}

// ============================================================================
// CRC32 (IEEE polynomial)
// ============================================================================

const Crc32 = std.hash.crc.Crc32;

/// Computes the CRC32 checksum using the IEEE polynomial.
///
/// CRC32 is widely used for error detection in network protocols
/// (Ethernet), file formats (gzip, PNG), and storage systems.
/// Returns a 32-bit checksum value.
export fn crc32(data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return Crc32.hash(data);
}

// ============================================================================
// Adler32
// ============================================================================

const Adler32 = std.hash.Adler32;

/// Computes the Adler-32 checksum.
///
/// Adler-32 is faster than CRC32 but has weaker error detection.
/// Used primarily in zlib compression. Returns a 32-bit checksum value.
export fn adler32(data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return Adler32.hash(data);
}

// ============================================================================
// XxHash64
// ============================================================================

const XxHash64 = std.hash.XxHash64;

/// Computes a 64-bit xxHash of the input data.
///
/// xxHash is an extremely fast non-cryptographic hash algorithm with
/// excellent distribution properties. Uses seed 0 by default.
export fn xxhash64(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return XxHash64.hash(0, data);
}

/// Computes a 64-bit xxHash with a custom seed.
///
/// Different seeds produce different hash values for the same input.
export fn xxhash64_seeded(seed: u64, data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return XxHash64.hash(seed, data);
}

// ============================================================================
// XxHash32
// ============================================================================

const XxHash32 = std.hash.XxHash32;

/// Computes a 32-bit xxHash of the input data.
///
/// The 32-bit variant is faster on 32-bit platforms (like WASM)
/// but has higher collision probability than xxHash64.
export fn xxhash32(data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return XxHash32.hash(0, data);
}

/// Computes a 32-bit xxHash with a custom seed.
export fn xxhash32_seeded(seed: u32, data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return XxHash32.hash(seed, data);
}

// ============================================================================
// Wyhash
// ============================================================================

const Wyhash = std.hash.Wyhash;

/// Computes a 64-bit wyhash of the input data.
///
/// wyhash is one of the fastest hash functions available, with excellent
/// statistical quality. Suitable for hash tables and general hashing.
export fn wyhash(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Wyhash.hash(0, data);
}

/// Computes a 64-bit wyhash with a custom seed.
export fn wyhash_seeded(seed: u64, data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Wyhash.hash(seed, data);
}

// ============================================================================
// CityHash64
// ============================================================================

const CityHash64 = std.hash.CityHash64;

/// Computes a 64-bit CityHash of the input data.
///
/// CityHash was developed by Google and is optimized for x86-64.
/// Good choice for hash tables with string keys.
export fn cityhash64(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return CityHash64.hash(data);
}

/// Computes a 64-bit CityHash with a custom seed.
export fn cityhash64_seeded(seed: u64, data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return CityHash64.hashWithSeed(data, seed);
}

// ============================================================================
// Murmur Hash (v2, 64-bit)
// ============================================================================

const Murmur2_64 = std.hash.Murmur2_64;

/// Computes a 64-bit MurmurHash2 of the input data.
///
/// MurmurHash2 is a widely-used general-purpose hash function.
/// Popular in many applications including databases and distributed systems.
export fn murmur2_64(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Murmur2_64.hash(data);
}

/// Computes a 64-bit MurmurHash2 with a custom seed.
export fn murmur2_64_seeded(seed: u64, data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Murmur2_64.hashWithSeed(data, seed);
}

// ============================================================================
// Fnv1a (64-bit)
// ============================================================================

const Fnv1a_64 = std.hash.Fnv1a_64;

/// Computes a 64-bit FNV-1a hash of the input data.
///
/// FNV-1a is simple, fast, and produces good distribution for short strings.
/// Commonly used in compilers and interpreters for symbol tables.
export fn fnv1a_64(data_ptr: [*]const u8, data_len: usize) u64 {
    const data = data_ptr[0..data_len];
    return Fnv1a_64.hash(data);
}

// ============================================================================
// Fnv1a (32-bit)
// ============================================================================

const Fnv1a_32 = std.hash.Fnv1a_32;

/// Computes a 32-bit FNV-1a hash of the input data.
///
/// The 32-bit variant uses less memory for hash table buckets
/// but has higher collision probability than FNV-1a 64-bit.
export fn fnv1a_32(data_ptr: [*]const u8, data_len: usize) u32 {
    const data = data_ptr[0..data_len];
    return Fnv1a_32.hash(data);
}
