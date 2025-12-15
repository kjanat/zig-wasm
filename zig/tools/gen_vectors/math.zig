//! Math test vector generator.
//! Generates test vectors for math functions including the new deg2rad, rad2deg, lcm, and fma.

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

fn writeFloat(writer: anytype, value: f64) !void {
    if (std.math.isNan(value)) {
        try writer.writeAll("\"NaN\"");
    } else if (std.math.isPositiveInf(value)) {
        try writer.writeAll("\"Infinity\"");
    } else if (std.math.isNegativeInf(value)) {
        try writer.writeAll("\"-Infinity\"");
    } else {
        try writer.print("{d:.15}", .{value});
    }
}

pub fn writeMathVectors(allocator: mem.Allocator) ![]u8 {
    var list = std.ArrayListUnmanaged(u8){};
    errdefer list.deinit(allocator);
    const writer = list.writer(allocator);

    try writer.writeAll("{\n");
    try writer.writeAll("  \"_meta\": {\n");
    try writer.writeAll("    \"generated_by\": \"zig/tools/gen_test_vectors.zig\",\n");
    try writer.writeAll("    \"description\": \"Deterministic test vectors for @zig-wasm/math\"\n");
    try writer.writeAll("  },\n");

    // deg2rad - convert degrees to radians
    try writer.writeAll("  \"deg2rad\": {\n");
    for (degree_inputs, 0..) |input, idx| {
        const result = input.value * (std.math.pi / 180.0);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < degree_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // rad2deg - convert radians to degrees
    try writer.writeAll("  \"rad2deg\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = input.value * (180.0 / std.math.pi);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // GCD
    try writer.writeAll("  \"gcd\": {\n");
    for (integer_test_pairs, 0..) |pair, idx| {
        const result = std.math.gcd(pair.a, pair.b);
        try writer.print("    \"{s}\": {d}", .{ pair.name, result });
        if (idx < integer_test_pairs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // LCM
    try writer.writeAll("  \"lcm\": {\n");
    for (integer_test_pairs, 0..) |pair, idx| {
        const result = if (pair.a == 0 or pair.b == 0) 0 else (pair.a / std.math.gcd(pair.a, pair.b)) * pair.b;
        try writer.print("    \"{s}\": {d}", .{ pair.name, result });
        if (idx < integer_test_pairs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // FMA - fused multiply-add
    try writer.writeAll("  \"fma\": {\n");
    for (fma_test_cases, 0..) |tc, idx| {
        const result = @mulAdd(f64, tc.x, tc.y, tc.z);
        try writer.print("    \"{s}\": ", .{tc.name});
        try writeFloat(writer, result);
        if (idx < fma_test_cases.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // sin
    try writer.writeAll("  \"sin\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = @sin(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // cos
    try writer.writeAll("  \"cos\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = @cos(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // tan
    try writer.writeAll("  \"tan\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = @tan(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // sqrt (only for non-negative values)
    try writer.writeAll("  \"sqrt\": {\n");
    var first_sqrt = true;
    for (math_test_inputs) |input| {
        if (input.value >= 0) {
            if (!first_sqrt) try writer.writeAll(",\n");
            first_sqrt = false;
            const result = @sqrt(input.value);
            try writer.print("    \"{s}\": ", .{input.name});
            try writeFloat(writer, result);
        }
    }
    try writer.writeAll("\n  },\n");

    // cbrt
    try writer.writeAll("  \"cbrt\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = std.math.cbrt(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // exp
    try writer.writeAll("  \"exp\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = @exp(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // log (only for positive values)
    try writer.writeAll("  \"log\": {\n");
    var first_log = true;
    for (math_test_inputs) |input| {
        if (input.value > 0) {
            if (!first_log) try writer.writeAll(",\n");
            first_log = false;
            const result = @log(input.value);
            try writer.print("    \"{s}\": ", .{input.name});
            try writeFloat(writer, result);
        }
    }
    try writer.writeAll("\n  },\n");

    // floor
    try writer.writeAll("  \"floor\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = @floor(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // ceil
    try writer.writeAll("  \"ceil\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = @ceil(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // round
    try writer.writeAll("  \"round\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = @round(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  },\n");

    // trunc
    try writer.writeAll("  \"trunc\": {\n");
    for (math_test_inputs, 0..) |input, idx| {
        const result = @trunc(input.value);
        try writer.print("    \"{s}\": ", .{input.name});
        try writeFloat(writer, result);
        if (idx < math_test_inputs.len - 1) try writer.writeAll(",");
        try writer.writeAll("\n");
    }
    try writer.writeAll("  }\n");

    try writer.writeAll("}\n");

    return list.toOwnedSlice(allocator);
}
