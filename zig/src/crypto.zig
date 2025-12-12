///! Cryptographic hash functions for WASM export
///! Wraps Zig's std.crypto module
const std = @import("std");
const allocator_mod = @import("allocator.zig");

const Allocator = std.mem.Allocator;

fn getAllocator() Allocator {
    return allocator_mod.getAllocator();
}

// Re-export allocator functions as exports
export fn alloc(size: usize) ?[*]u8 {
    return allocator_mod.alloc(size);
}

export fn free(ptr: [*]u8, size: usize) void {
    allocator_mod.free(ptr, size);
}

// ============================================================================
// MD5
// ============================================================================

const Md5 = std.crypto.hash.Md5;
const MD5_DIGEST_LEN = Md5.digest_length;

/// Hash data with MD5, write result to output buffer
export fn md5_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [MD5_DIGEST_LEN]u8 = undefined;
    Md5.hash(data, &digest, .{});
    @memcpy(out_ptr[0..MD5_DIGEST_LEN], &digest);
}

/// Get MD5 digest length
export fn md5_digest_length() usize {
    return MD5_DIGEST_LEN;
}

// ============================================================================
// SHA1
// ============================================================================

const Sha1 = std.crypto.hash.Sha1;
const SHA1_DIGEST_LEN = Sha1.digest_length;

/// Hash data with SHA1
export fn sha1_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA1_DIGEST_LEN]u8 = undefined;
    Sha1.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA1_DIGEST_LEN], &digest);
}

/// Get SHA1 digest length
export fn sha1_digest_length() usize {
    return SHA1_DIGEST_LEN;
}

// ============================================================================
// SHA256
// ============================================================================

const Sha256 = std.crypto.hash.sha2.Sha256;
const SHA256_DIGEST_LEN = Sha256.digest_length;

/// Hash data with SHA256
export fn sha256_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA256_DIGEST_LEN]u8 = undefined;
    Sha256.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA256_DIGEST_LEN], &digest);
}

/// Get SHA256 digest length
export fn sha256_digest_length() usize {
    return SHA256_DIGEST_LEN;
}

// ============================================================================
// SHA384
// ============================================================================

const Sha384 = std.crypto.hash.sha2.Sha384;
const SHA384_DIGEST_LEN = Sha384.digest_length;

/// Hash data with SHA384
export fn sha384_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA384_DIGEST_LEN]u8 = undefined;
    Sha384.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA384_DIGEST_LEN], &digest);
}

/// Get SHA384 digest length
export fn sha384_digest_length() usize {
    return SHA384_DIGEST_LEN;
}

// ============================================================================
// SHA512
// ============================================================================

const Sha512 = std.crypto.hash.sha2.Sha512;
const SHA512_DIGEST_LEN = Sha512.digest_length;

/// Hash data with SHA512
export fn sha512_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA512_DIGEST_LEN]u8 = undefined;
    Sha512.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA512_DIGEST_LEN], &digest);
}

/// Get SHA512 digest length
export fn sha512_digest_length() usize {
    return SHA512_DIGEST_LEN;
}

// ============================================================================
// SHA3-256
// ============================================================================

const Sha3_256 = std.crypto.hash.sha3.Sha3_256;
const SHA3_256_DIGEST_LEN = Sha3_256.digest_length;

/// Hash data with SHA3-256
export fn sha3_256_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA3_256_DIGEST_LEN]u8 = undefined;
    Sha3_256.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA3_256_DIGEST_LEN], &digest);
}

/// Get SHA3-256 digest length
export fn sha3_256_digest_length() usize {
    return SHA3_256_DIGEST_LEN;
}

// ============================================================================
// SHA3-512
// ============================================================================

const Sha3_512 = std.crypto.hash.sha3.Sha3_512;
const SHA3_512_DIGEST_LEN = Sha3_512.digest_length;

/// Hash data with SHA3-512
export fn sha3_512_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA3_512_DIGEST_LEN]u8 = undefined;
    Sha3_512.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA3_512_DIGEST_LEN], &digest);
}

/// Get SHA3-512 digest length
export fn sha3_512_digest_length() usize {
    return SHA3_512_DIGEST_LEN;
}

// ============================================================================
// BLAKE2b-256
// ============================================================================

const Blake2b256 = std.crypto.hash.blake2.Blake2b256;
const BLAKE2B256_DIGEST_LEN = Blake2b256.digest_length;

/// Hash data with BLAKE2b-256
export fn blake2b256_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [BLAKE2B256_DIGEST_LEN]u8 = undefined;
    Blake2b256.hash(data, &digest, .{});
    @memcpy(out_ptr[0..BLAKE2B256_DIGEST_LEN], &digest);
}

/// Get BLAKE2b-256 digest length
export fn blake2b256_digest_length() usize {
    return BLAKE2B256_DIGEST_LEN;
}

// ============================================================================
// BLAKE2s-256
// ============================================================================

const Blake2s256 = std.crypto.hash.blake2.Blake2s256;
const BLAKE2S256_DIGEST_LEN = Blake2s256.digest_length;

/// Hash data with BLAKE2s-256
export fn blake2s256_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [BLAKE2S256_DIGEST_LEN]u8 = undefined;
    Blake2s256.hash(data, &digest, .{});
    @memcpy(out_ptr[0..BLAKE2S256_DIGEST_LEN], &digest);
}

/// Get BLAKE2s-256 digest length
export fn blake2s256_digest_length() usize {
    return BLAKE2S256_DIGEST_LEN;
}

// ============================================================================
// BLAKE3
// ============================================================================

const Blake3 = std.crypto.hash.Blake3;
const BLAKE3_DIGEST_LEN = 32; // Default output length

/// Hash data with BLAKE3
export fn blake3_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var hasher = Blake3.init(.{});
    hasher.update(data);
    var digest: [BLAKE3_DIGEST_LEN]u8 = undefined;
    hasher.final(&digest);
    @memcpy(out_ptr[0..BLAKE3_DIGEST_LEN], &digest);
}

/// Get BLAKE3 digest length
export fn blake3_digest_length() usize {
    return BLAKE3_DIGEST_LEN;
}

// ============================================================================
// HMAC
// ============================================================================

/// HMAC-SHA256
export fn hmac_sha256(
    key_ptr: [*]const u8,
    key_len: usize,
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
) void {
    const HmacSha256 = std.crypto.auth.hmac.sha2.HmacSha256;
    const key = key_ptr[0..key_len];
    const data = data_ptr[0..data_len];
    var mac: [HmacSha256.mac_length]u8 = undefined;
    HmacSha256.create(&mac, data, key);
    @memcpy(out_ptr[0..HmacSha256.mac_length], &mac);
}

/// HMAC-SHA256 output length
export fn hmac_sha256_length() usize {
    return std.crypto.auth.hmac.sha2.HmacSha256.mac_length;
}

/// HMAC-SHA512
export fn hmac_sha512(
    key_ptr: [*]const u8,
    key_len: usize,
    data_ptr: [*]const u8,
    data_len: usize,
    out_ptr: [*]u8,
) void {
    const HmacSha512 = std.crypto.auth.hmac.sha2.HmacSha512;
    const key = key_ptr[0..key_len];
    const data = data_ptr[0..data_len];
    var mac: [HmacSha512.mac_length]u8 = undefined;
    HmacSha512.create(&mac, data, key);
    @memcpy(out_ptr[0..HmacSha512.mac_length], &mac);
}

/// HMAC-SHA512 output length
export fn hmac_sha512_length() usize {
    return std.crypto.auth.hmac.sha2.HmacSha512.mac_length;
}
