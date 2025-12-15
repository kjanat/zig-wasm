//! Math test vector generator.
//! Generates test vectors for math functions including deg2rad, rad2deg, gcd, lcm, and fma.

const std = @import("std");
const common = @import("common.zig");
const mem = common.mem;

// ============================================================================
// Math-specific test inputs
// ============================================================================

const MathTestInput = struct {
    name: []const u8,
    value: f64,
};

// Test inputs for math functions - carefully chosen to cover edge cases
const math_test_inputs = [_]MathTestInput{
    // Basic values
    .{ .name = "zero", .value = 0.0 },
    .{ .name = "one", .value = 1.0 },
    .{ .name = "negative_one", .value = -1.0 },
    .{ .name = "half", .value = 0.5 },
    .{ .name = "negative_half", .value = -0.5 },

    // Common angles in radians
    .{ .name = "pi", .value = std.math.pi },
    .{ .name = "pi_over_2", .value = std.math.pi / 2.0 },
    .{ .name = "pi_over_3", .value = std.math.pi / 3.0 },
    .{ .name = "pi_over_4", .value = std.math.pi / 4.0 },
    .{ .name = "pi_over_6", .value = std.math.pi / 6.0 },
    .{ .name = "two_pi", .value = std.math.pi * 2.0 },
    .{ .name = "negative_pi", .value = -std.math.pi },

    // Small values (for precision testing)
    .{ .name = "small", .value = 0.001 },
    .{ .name = "very_small", .value = 1e-10 },
    .{ .name = "negative_small", .value = -0.001 },

    // Larger values
    .{ .name = "ten", .value = 10.0 },
    .{ .name = "hundred", .value = 100.0 },
    .{ .name = "negative_ten", .value = -10.0 },

    // Euler's number
    .{ .name = "e", .value = std.math.e },

    // Square root / cube root inputs
    .{ .name = "two", .value = 2.0 },
    .{ .name = "three", .value = 3.0 },
    .{ .name = "four", .value = 4.0 },
    .{ .name = "nine", .value = 9.0 },
    .{ .name = "sixteen", .value = 16.0 },
    .{ .name = "twenty_seven", .value = 27.0 },

    // Fractional values
    .{ .name = "one_third", .value = 1.0 / 3.0 },
    .{ .name = "two_thirds", .value = 2.0 / 3.0 },
    .{ .name = "point_seven_five", .value = 0.75 },
    .{ .name = "point_two_five", .value = 0.25 },
};

// Degree inputs for deg2rad testing
const degree_inputs = [_]MathTestInput{
    .{ .name = "deg_0", .value = 0.0 },
    .{ .name = "deg_30", .value = 30.0 },
    .{ .name = "deg_45", .value = 45.0 },
    .{ .name = "deg_60", .value = 60.0 },
    .{ .name = "deg_90", .value = 90.0 },
    .{ .name = "deg_120", .value = 120.0 },
    .{ .name = "deg_135", .value = 135.0 },
    .{ .name = "deg_150", .value = 150.0 },
    .{ .name = "deg_180", .value = 180.0 },
    .{ .name = "deg_270", .value = 270.0 },
    .{ .name = "deg_360", .value = 360.0 },
    .{ .name = "deg_negative_45", .value = -45.0 },
    .{ .name = "deg_negative_90", .value = -90.0 },
    .{ .name = "deg_negative_180", .value = -180.0 },
    .{ .name = "deg_450", .value = 450.0 }, // > 360
};

// Test inputs for integer functions (GCD, LCM)
const IntegerTestPair = struct {
    name: []const u8,
    a: u64,
    b: u64,
};

const integer_test_pairs = [_]IntegerTestPair{
    .{ .name = "12_8", .a = 12, .b = 8 },
    .{ .name = "21_14", .a = 21, .b = 14 },
    .{ .name = "48_18", .a = 48, .b = 18 },
    .{ .name = "100_25", .a = 100, .b = 25 },
    .{ .name = "0_5", .a = 0, .b = 5 },
    .{ .name = "5_0", .a = 5, .b = 0 },
    // Note: gcd(0, 0) is undefined in Zig stdlib
    .{ .name = "1_1", .a = 1, .b = 1 },
    .{ .name = "prime_17_13", .a = 17, .b = 13 },
    .{ .name = "4_6", .a = 4, .b = 6 },
    .{ .name = "21_6", .a = 21, .b = 6 },
    .{ .name = "123456_789012", .a = 123456, .b = 789012 },
    .{ .name = "large_coprime", .a = 999983, .b = 999979 }, // Two large primes
    .{ .name = "same_value", .a = 42, .b = 42 },
    .{ .name = "one_and_large", .a = 1, .b = 123456 },
};

// FMA test cases
const FmaTestCase = struct {
    name: []const u8,
    x: f64,
    y: f64,
    z: f64,
};

const fma_test_cases = [_]FmaTestCase{
    .{ .name = "2_3_4", .x = 2.0, .y = 3.0, .z = 4.0 }, // 2*3+4 = 10
    .{ .name = "1_1_1", .x = 1.0, .y = 1.0, .z = 1.0 }, // 1*1+1 = 2
    .{ .name = "0_5_10", .x = 0.0, .y = 5.0, .z = 10.0 }, // 0*5+10 = 10
    .{ .name = "neg_2_3_10", .x = -2.0, .y = 3.0, .z = 10.0 }, // -2*3+10 = 4
    .{ .name = "half_half_quarter", .x = 0.5, .y = 0.5, .z = 0.25 }, // 0.5*0.5+0.25 = 0.5
    .{ .name = "pi_2_0", .x = std.math.pi, .y = 2.0, .z = 0.0 }, // pi*2 = 2*pi
    .{ .name = "e_e_1", .x = std.math.e, .y = std.math.e, .z = 1.0 }, // e^2 + 1
    .{ .name = "neg_neg_neg", .x = -1.5, .y = -2.5, .z = -3.5 }, // 1.5*2.5-3.5 = 0.25
    .{ .name = "large_small_med", .x = 1e6, .y = 1e-6, .z = 0.5 }, // 1 + 0.5 = 1.5
    .{ .name = "precision_test", .x = 1.0000001, .y = 1.0000001, .z = -1.0000002 }, // Tests precision
};

// Unary math functions that operate on all inputs
const UnaryMathFn = struct {
    name: []const u8,
    func: *const fn (f64) f64,
    filter: ?*const fn (f64) bool = null, // Optional filter for valid inputs
};

fn mathSin(x: f64) f64 {
    return @sin(x);
}
fn mathCos(x: f64) f64 {
    return @cos(x);
}
fn mathTan(x: f64) f64 {
    return @tan(x);
}
fn mathSqrt(x: f64) f64 {
    return @sqrt(x);
}
fn mathCbrt(x: f64) f64 {
    return std.math.cbrt(x);
}
fn mathExp(x: f64) f64 {
    return @exp(x);
}
fn mathLog(x: f64) f64 {
    return @log(x);
}
fn mathFloor(x: f64) f64 {
    return @floor(x);
}
fn mathCeil(x: f64) f64 {
    return @ceil(x);
}
fn mathRound(x: f64) f64 {
    return @round(x);
}
fn mathTrunc(x: f64) f64 {
    return @trunc(x);
}
fn isNonNegative(x: f64) bool {
    return x >= 0;
}
fn isPositive(x: f64) bool {
    return x > 0;
}

const unary_functions = [_]UnaryMathFn{
    .{ .name = "sin", .func = mathSin },
    .{ .name = "cos", .func = mathCos },
    .{ .name = "tan", .func = mathTan },
    .{ .name = "sqrt", .func = mathSqrt, .filter = isNonNegative },
    .{ .name = "cbrt", .func = mathCbrt },
    .{ .name = "exp", .func = mathExp },
    .{ .name = "log", .func = mathLog, .filter = isPositive },
    .{ .name = "floor", .func = mathFloor },
    .{ .name = "ceil", .func = mathCeil },
    .{ .name = "round", .func = mathRound },
    .{ .name = "trunc", .func = mathTrunc },
};

/// Write a float value, handling special cases (NaN, Inf)
fn writeFloatValue(ws: *std.json.Stringify, value: f64) !void {
    if (std.math.isNan(value)) {
        try ws.write("NaN");
    } else if (std.math.isPositiveInf(value)) {
        try ws.write("Infinity");
    } else if (std.math.isNegativeInf(value)) {
        try ws.write("-Infinity");
    } else {
        try ws.print("{d:.15}", .{value});
    }
}

pub fn writeMathVectors(allocator: mem.Allocator) ![]u8 {
    var out: std.io.Writer.Allocating = .init(allocator);
    errdefer out.deinit();

    var ws: std.json.Stringify = .{ .writer = &out.writer, .options = .{ .whitespace = .indent_2 } };

    try ws.beginObject();

    // Meta section
    try ws.objectField("_meta");
    try ws.beginObject();
    try ws.objectField("generated_by");
    try ws.write("zig/tools/gen_test_vectors.zig");
    try ws.objectField("description");
    try ws.write("Deterministic test vectors for @zig-wasm/math");
    try ws.endObject();

    // deg2rad - convert degrees to radians
    try ws.objectField("deg2rad");
    try ws.beginObject();
    for (degree_inputs) |input| {
        const result = input.value * (std.math.pi / 180.0);
        try ws.objectField(input.name);
        try writeFloatValue(&ws, result);
    }
    try ws.endObject();

    // rad2deg - convert radians to degrees
    try ws.objectField("rad2deg");
    try ws.beginObject();
    for (math_test_inputs) |input| {
        const result = input.value * (180.0 / std.math.pi);
        try ws.objectField(input.name);
        try writeFloatValue(&ws, result);
    }
    try ws.endObject();

    // GCD
    try ws.objectField("gcd");
    try ws.beginObject();
    for (integer_test_pairs) |pair| {
        const result = std.math.gcd(pair.a, pair.b);
        try ws.objectField(pair.name);
        try ws.write(result);
    }
    try ws.endObject();

    // LCM
    try ws.objectField("lcm");
    try ws.beginObject();
    for (integer_test_pairs) |pair| {
        const result = if (pair.a == 0 or pair.b == 0) 0 else (pair.a / std.math.gcd(pair.a, pair.b)) * pair.b;
        try ws.objectField(pair.name);
        try ws.write(result);
    }
    try ws.endObject();

    // FMA - fused multiply-add
    try ws.objectField("fma");
    try ws.beginObject();
    for (fma_test_cases) |tc| {
        const result = @mulAdd(f64, tc.x, tc.y, tc.z);
        try ws.objectField(tc.name);
        try writeFloatValue(&ws, result);
    }
    try ws.endObject();

    // Unary math functions
    for (unary_functions) |func| {
        try ws.objectField(func.name);
        try ws.beginObject();
        for (math_test_inputs) |input| {
            // Skip inputs that don't pass the filter
            if (func.filter) |filter| {
                if (!filter(input.value)) continue;
            }
            const result = func.func(input.value);
            try ws.objectField(input.name);
            try writeFloatValue(&ws, result);
        }
        try ws.endObject();
    }

    try ws.endObject();

    // Add trailing newline for POSIX compliance
    try out.writer.writeByte('\n');

    return out.toOwnedSlice();
}
