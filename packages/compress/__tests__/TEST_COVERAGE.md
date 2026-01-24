# Compress Package Test Coverage

## Test Summary

42 comprehensive tests covering XZ and LZMA decompression functionality.

## Coverage Areas

### 1. **API Exports** (4 tests)

- Lifecycle helpers (init, isInitialized)
- Async decompression functions
- Sync decompression functions
- Error types (NotInitializedError)

### 2. **XZ Decompression - Async** (10 tests)

- Empty data decompression
- Single byte decompression
- Text decompression (Hello World)
- Repeated text with high compression ratio (4.5KB compressed to 148 bytes)
- Binary data integrity (1488 bytes)
- Large data decompression (100KB compressed to 156 bytes = 99.8% compression)
- JSON structure preservation
- Invalid XZ header error handling
- Corrupted data error handling
- Auto-initialization on first call

### 3. **LZMA Decompression - Async** (9 tests)

- Empty data decompression
- Single byte decompression
- Text decompression
- Repeated text with high compression
- Binary data integrity
- Large data decompression (excellent 99.9% compression ratio)
- JSON structure preservation
- Invalid LZMA header error handling
- Corrupted data error handling

### 4. **Sync API** (8 tests)

- XZ sync: empty, text, large data, corrupted data handling
- LZMA sync: empty, text, large data, corrupted data handling
- Initialization requirement validation

### 5. **Memory Management** (4 tests)

- 100 sequential decompressions without memory leaks
- 50 alternating XZ/LZMA sync operations
- Mixed async/sync operation handling
- Variable data sizes (empty → 100KB)

### 6. **Round-trip Validation** (3 tests)

- Text data integrity (XZ and LZMA produce identical output)
- Binary data byte-for-byte equality verification
- JSON structure preservation across compression formats

### 7. **Edge Cases** (3 tests)

- Consecutive failure state recovery
- Empty input vs. valid empty compression distinction
- Compression efficiency verification (>99% compression for repetitive data)

## Test Fixtures

Located in `tests/fixtures/`:

**Uncompressed Data:**

- empty.txt (0 bytes)
- single-byte.txt (1 byte)
- hello.txt (13 bytes)
- text.txt (4.5KB - repeated text)
- binary.txt (1.4KB - binary sequence 0-255)
- large.txt (100KB - highly compressible)
- json.txt (2.3KB - JSON structure)

**XZ Compressed:** `.txt.xz` variants of above **LZMA Compressed:** `.txt.lzma`
variants of above **Invalid/Corrupted:**

- invalid.xz - truncated header
- invalid.lzma - malformed header
- garbage.xz - random data
- garbage.lzma - random data

## Key Test Insights

1. **Compression Efficiency**: Large repetitive data achieves 99.8% compression
   (100KB → 156 bytes)
2. **Data Integrity**: Byte-for-byte validation ensures no data corruption
3. **Format Equivalence**: XZ and LZMA produce identical decompressed output
   from same source
4. **Error Resilience**: System recovers gracefully from decompression failures
5. **Memory Safety**: 100+ operations without leaks validates proper WASM memory
   management

## Real-World Bug Detection

These tests would catch:

- ✅ Decompression algorithm errors (corrupted output)
- ✅ Memory leaks in WASM allocation/deallocation
- ✅ Invalid header/data handling failures
- ✅ Async/sync API initialization bugs
- ✅ Large data handling edge cases
- ✅ Binary data corruption issues
- ✅ Format-specific parsing errors
