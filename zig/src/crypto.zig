//! Cryptographic hash functions for WASM export.
//!
//! Provides secure hash algorithms suitable for cryptographic use:
//! - **MD5**: 128-bit, legacy (avoid for security-critical applications)
//! - **SHA-1**: 160-bit, legacy (avoid for security-critical applications)
//! - **SHA-2**: SHA-256 (256-bit), SHA-384 (384-bit), SHA-512 (512-bit)
//! - **SHA-3**: SHA3-256 (256-bit), SHA3-512 (512-bit) - Keccak-based
//! - **BLAKE2**: BLAKE2b-256 (256-bit), BLAKE2s-256 (256-bit)
//! - **BLAKE3**: 256-bit, high-performance tree hash
//!
//! Also includes HMAC (Hash-based Message Authentication Code) for
//! message authentication using SHA-256 and SHA-512.
//!
//! All hash functions write to pre-allocated output buffers. Use the
//! corresponding `*_digest_length()` function to determine buffer size.

const std = @import("std");
const allocator_mod = @import("allocator.zig");

const Allocator = std.mem.Allocator;

/// Returns the WASM allocator for internal use.
fn getAllocator() Allocator {
    return allocator_mod.getAllocator();
}

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
// MD5
// ============================================================================

const Md5 = std.crypto.hash.Md5;
const MD5_DIGEST_LEN = Md5.digest_length;

/// Computes the MD5 hash of the input data.
///
/// **Warning**: MD5 is cryptographically broken. Use only for legacy
/// compatibility or non-security checksums. Output buffer must be 16 bytes.
export fn md5_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [MD5_DIGEST_LEN]u8 = undefined;
    Md5.hash(data, &digest, .{});
    @memcpy(out_ptr[0..MD5_DIGEST_LEN], &digest);
}

/// Returns the MD5 digest length (16 bytes / 128 bits).
export fn md5_digest_length() usize {
    return MD5_DIGEST_LEN;
}

// ============================================================================
// SHA1
// ============================================================================

const Sha1 = std.crypto.hash.Sha1;
const SHA1_DIGEST_LEN = Sha1.digest_length;

/// Computes the SHA-1 hash of the input data.
///
/// **Warning**: SHA-1 has known collision vulnerabilities. Use SHA-256 or
/// stronger for security-critical applications. Output buffer must be 20 bytes.
export fn sha1_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA1_DIGEST_LEN]u8 = undefined;
    Sha1.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA1_DIGEST_LEN], &digest);
}

/// Returns the SHA-1 digest length (20 bytes / 160 bits).
export fn sha1_digest_length() usize {
    return SHA1_DIGEST_LEN;
}

// ============================================================================
// SHA256
// ============================================================================

const Sha256 = std.crypto.hash.sha2.Sha256;
const SHA256_DIGEST_LEN = Sha256.digest_length;

/// Computes the SHA-256 hash of the input data.
///
/// SHA-256 is widely used and provides strong security guarantees.
/// Output buffer must be 32 bytes.
export fn sha256_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA256_DIGEST_LEN]u8 = undefined;
    Sha256.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA256_DIGEST_LEN], &digest);
}

/// Returns the SHA-256 digest length (32 bytes / 256 bits).
export fn sha256_digest_length() usize {
    return SHA256_DIGEST_LEN;
}

// ============================================================================
// SHA384
// ============================================================================

const Sha384 = std.crypto.hash.sha2.Sha384;
const SHA384_DIGEST_LEN = Sha384.digest_length;

/// Computes the SHA-384 hash of the input data.
///
/// SHA-384 is a truncated SHA-512 with different initial values.
/// Output buffer must be 48 bytes.
export fn sha384_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA384_DIGEST_LEN]u8 = undefined;
    Sha384.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA384_DIGEST_LEN], &digest);
}

/// Returns the SHA-384 digest length (48 bytes / 384 bits).
export fn sha384_digest_length() usize {
    return SHA384_DIGEST_LEN;
}

// ============================================================================
// SHA512
// ============================================================================

const Sha512 = std.crypto.hash.sha2.Sha512;
const SHA512_DIGEST_LEN = Sha512.digest_length;

/// Computes the SHA-512 hash of the input data.
///
/// SHA-512 provides the highest security margin in the SHA-2 family.
/// Output buffer must be 64 bytes.
export fn sha512_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA512_DIGEST_LEN]u8 = undefined;
    Sha512.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA512_DIGEST_LEN], &digest);
}

/// Returns the SHA-512 digest length (64 bytes / 512 bits).
export fn sha512_digest_length() usize {
    return SHA512_DIGEST_LEN;
}

// ============================================================================
// SHA3-256
// ============================================================================

const Sha3_256 = std.crypto.hash.sha3.Sha3_256;
const SHA3_256_DIGEST_LEN = Sha3_256.digest_length;

/// Computes the SHA3-256 hash of the input data.
///
/// SHA-3 uses the Keccak sponge construction, providing resistance against
/// length-extension attacks. Output buffer must be 32 bytes.
export fn sha3_256_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA3_256_DIGEST_LEN]u8 = undefined;
    Sha3_256.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA3_256_DIGEST_LEN], &digest);
}

/// Returns the SHA3-256 digest length (32 bytes / 256 bits).
export fn sha3_256_digest_length() usize {
    return SHA3_256_DIGEST_LEN;
}

// ============================================================================
// SHA3-512
// ============================================================================

const Sha3_512 = std.crypto.hash.sha3.Sha3_512;
const SHA3_512_DIGEST_LEN = Sha3_512.digest_length;

/// Computes the SHA3-512 hash of the input data.
///
/// SHA3-512 provides the maximum security margin in the SHA-3 family.
/// Output buffer must be 64 bytes.
export fn sha3_512_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [SHA3_512_DIGEST_LEN]u8 = undefined;
    Sha3_512.hash(data, &digest, .{});
    @memcpy(out_ptr[0..SHA3_512_DIGEST_LEN], &digest);
}

/// Returns the SHA3-512 digest length (64 bytes / 512 bits).
export fn sha3_512_digest_length() usize {
    return SHA3_512_DIGEST_LEN;
}

// ============================================================================
// BLAKE2b-256
// ============================================================================

const Blake2b256 = std.crypto.hash.blake2.Blake2b256;
const BLAKE2B256_DIGEST_LEN = Blake2b256.digest_length;

/// Computes the BLAKE2b-256 hash of the input data.
///
/// BLAKE2b is optimized for 64-bit platforms and is faster than SHA-2
/// while providing equivalent security. Output buffer must be 32 bytes.
export fn blake2b256_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [BLAKE2B256_DIGEST_LEN]u8 = undefined;
    Blake2b256.hash(data, &digest, .{});
    @memcpy(out_ptr[0..BLAKE2B256_DIGEST_LEN], &digest);
}

/// Returns the BLAKE2b-256 digest length (32 bytes / 256 bits).
export fn blake2b256_digest_length() usize {
    return BLAKE2B256_DIGEST_LEN;
}

// ============================================================================
// BLAKE2s-256
// ============================================================================

const Blake2s256 = std.crypto.hash.blake2.Blake2s256;
const BLAKE2S256_DIGEST_LEN = Blake2s256.digest_length;

/// Computes the BLAKE2s-256 hash of the input data.
///
/// BLAKE2s is optimized for 32-bit platforms (like WASM) and 8-bit
/// microcontrollers. Output buffer must be 32 bytes.
export fn blake2s256_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var digest: [BLAKE2S256_DIGEST_LEN]u8 = undefined;
    Blake2s256.hash(data, &digest, .{});
    @memcpy(out_ptr[0..BLAKE2S256_DIGEST_LEN], &digest);
}

/// Returns the BLAKE2s-256 digest length (32 bytes / 256 bits).
export fn blake2s256_digest_length() usize {
    return BLAKE2S256_DIGEST_LEN;
}

// ============================================================================
// BLAKE3
// ============================================================================

const Blake3 = std.crypto.hash.Blake3;
const BLAKE3_DIGEST_LEN = 32; // Default output length

/// Computes the BLAKE3 hash of the input data.
///
/// BLAKE3 is a high-performance cryptographic hash with parallelization
/// support. It's significantly faster than SHA-2 and BLAKE2 on modern
/// hardware. Output buffer must be 32 bytes.
export fn blake3_hash(data_ptr: [*]const u8, data_len: usize, out_ptr: [*]u8) void {
    const data = data_ptr[0..data_len];
    var hasher = Blake3.init(.{});
    hasher.update(data);
    var digest: [BLAKE3_DIGEST_LEN]u8 = undefined;
    hasher.final(&digest);
    @memcpy(out_ptr[0..BLAKE3_DIGEST_LEN], &digest);
}

/// Returns the BLAKE3 digest length (32 bytes / 256 bits).
export fn blake3_digest_length() usize {
    return BLAKE3_DIGEST_LEN;
}

// ============================================================================
// HMAC
// ============================================================================

/// Computes HMAC-SHA256 for message authentication.
///
/// HMAC combines a secret key with SHA-256 to produce a message
/// authentication code. Use this to verify both integrity and authenticity.
/// Output buffer must be 32 bytes.
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

/// Returns the HMAC-SHA256 output length (32 bytes).
export fn hmac_sha256_length() usize {
    return std.crypto.auth.hmac.sha2.HmacSha256.mac_length;
}

/// Computes HMAC-SHA512 for message authentication.
///
/// HMAC-SHA512 provides a larger MAC for applications requiring
/// extra security margin. Output buffer must be 64 bytes.
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

/// Returns the HMAC-SHA512 output length (64 bytes).
export fn hmac_sha512_length() usize {
    return std.crypto.auth.hmac.sha2.HmacSha512.mac_length;
}
