import {
  encodeFuncType,
  encodeLimits,
  encodeSection,
  encodeString,
  encodeVec,
  ExportKind,
  ImportKind,
  isValidWasmHeader,
  Op,
  parseWasmSections,
  Section,
  SECTION_NAMES,
  TypeConstructor,
  ValType,
  WASM_HEADER,
  WASM_MAGIC,
  WASM_VERSION,
} from "@zig-wasm/core";
import { describe, expect, it } from "vitest";

describe("wasm-binary", () => {
  describe("constants", () => {
    it("WASM_MAGIC is correct", () => {
      expect(WASM_MAGIC).toEqual([0x00, 0x61, 0x73, 0x6d]);
    });

    it("WASM_VERSION is correct", () => {
      expect(WASM_VERSION).toEqual([0x01, 0x00, 0x00, 0x00]);
    });

    it("WASM_HEADER combines magic and version", () => {
      expect(WASM_HEADER).toEqual([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    });
  });

  describe("enums", () => {
    it("Section enum has correct values", () => {
      expect(Section.Type).toBe(1);
      expect(Section.Import).toBe(2);
      expect(Section.Function).toBe(3);
      expect(Section.Memory).toBe(5);
      expect(Section.Export).toBe(7);
      expect(Section.Code).toBe(10);
    });

    it("ValType enum has correct values", () => {
      expect(ValType.I32).toBe(0x7f);
      expect(ValType.I64).toBe(0x7e);
      expect(ValType.F32).toBe(0x7d);
      expect(ValType.F64).toBe(0x7c);
    });

    it("Op enum has correct values", () => {
      expect(Op.End).toBe(0x0b);
      expect(Op.Call).toBe(0x10);
      expect(Op.I32Const).toBe(0x41);
    });

    it("ExportKind enum has correct values", () => {
      expect(ExportKind.Func).toBe(0);
      expect(ExportKind.Memory).toBe(2);
    });

    it("ImportKind enum has correct values", () => {
      expect(ImportKind.Func).toBe(0);
      expect(ImportKind.Memory).toBe(2);
    });

    it("TypeConstructor enum has correct value", () => {
      expect(TypeConstructor.Func).toBe(0x60);
    });

    it("SECTION_NAMES maps all sections", () => {
      expect(SECTION_NAMES[Section.Type]).toBe("type");
      expect(SECTION_NAMES[Section.Import]).toBe("import");
      expect(SECTION_NAMES[Section.Export]).toBe("export");
      expect(SECTION_NAMES[Section.Code]).toBe("code");
    });
  });

  describe("encodeString", () => {
    it("encodes short strings", () => {
      expect(encodeString("env")).toEqual([3, 0x65, 0x6e, 0x76]);
    });

    it("encodes 'memory'", () => {
      expect(encodeString("memory")).toEqual([6, 0x6d, 0x65, 0x6d, 0x6f, 0x72, 0x79]);
    });

    it("encodes empty string", () => {
      expect(encodeString("")).toEqual([0]);
    });

    it("encodes '_panic'", () => {
      expect(encodeString("_panic")).toEqual([6, 0x5f, 0x70, 0x61, 0x6e, 0x69, 0x63]);
    });
  });

  describe("encodeSection", () => {
    it("encodes section with content", () => {
      const content = [0x01, 0x02, 0x03];
      const result = encodeSection(Section.Type, content);
      expect(result).toEqual([Section.Type, 3, 0x01, 0x02, 0x03]);
    });

    it("encodes empty section", () => {
      const result = encodeSection(Section.Custom, []);
      expect(result).toEqual([Section.Custom, 0]);
    });
  });

  describe("encodeVec", () => {
    it("encodes vector of items", () => {
      const items = [[0x01], [0x02], [0x03]];
      const result = encodeVec(items);
      expect(result).toEqual([3, 0x01, 0x02, 0x03]);
    });

    it("encodes empty vector", () => {
      expect(encodeVec([])).toEqual([0]);
    });

    it("encodes vector with multi-byte items", () => {
      const items = [[0x01, 0x02], [0x03, 0x04]];
      const result = encodeVec(items);
      expect(result).toEqual([2, 0x01, 0x02, 0x03, 0x04]);
    });
  });

  describe("encodeFuncType", () => {
    it("encodes () -> void", () => {
      const result = encodeFuncType([], []);
      expect(result).toEqual([0x60, 0, 0]);
    });

    it("encodes (i32, i32) -> i32", () => {
      const result = encodeFuncType([ValType.I32, ValType.I32], [ValType.I32]);
      expect(result).toEqual([0x60, 2, ValType.I32, ValType.I32, 1, ValType.I32]);
    });

    it("encodes (i32, i32) -> void (panic signature)", () => {
      const result = encodeFuncType([ValType.I32, ValType.I32], []);
      expect(result).toEqual([0x60, 2, ValType.I32, ValType.I32, 0]);
    });
  });

  describe("encodeLimits", () => {
    it("encodes min-only limits", () => {
      expect(encodeLimits(1)).toEqual([0x00, 1]);
    });

    it("encodes min-max limits", () => {
      expect(encodeLimits(1, 10)).toEqual([0x01, 1, 10]);
    });

    it("encodes zero min", () => {
      expect(encodeLimits(0)).toEqual([0x00, 0]);
    });
  });

  describe("isValidWasmHeader", () => {
    it("returns true for valid header", () => {
      expect(isValidWasmHeader(WASM_HEADER)).toBe(true);
    });

    it("returns true for valid header with extra bytes", () => {
      expect(isValidWasmHeader([...WASM_HEADER, 0x01, 0x02])).toBe(true);
    });

    it("returns false for invalid magic", () => {
      expect(isValidWasmHeader([0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00])).toBe(false);
    });

    it("returns false for invalid version", () => {
      expect(isValidWasmHeader([...WASM_MAGIC, 0x02, 0x00, 0x00, 0x00])).toBe(false);
    });

    it("returns false for truncated header", () => {
      expect(isValidWasmHeader(WASM_MAGIC)).toBe(false);
    });

    it("returns false for empty array", () => {
      expect(isValidWasmHeader([])).toBe(false);
    });
  });

  describe("parseWasmSections", () => {
    it("parses empty module (header only)", () => {
      const sections = parseWasmSections(WASM_HEADER);
      expect(sections.size).toBe(0);
    });

    it("parses module with memory section", () => {
      const wasm = [
        ...WASM_HEADER,
        Section.Memory, // section id
        0x03, // size
        0x01, // 1 memory
        0x00, // no max
        0x01, // 1 page
      ];
      const sections = parseWasmSections(wasm);

      expect(sections.has(Section.Memory)).toBe(true);
      const mem = sections.get(Section.Memory)!;
      expect(mem.offset).toBe(8);
      expect(mem.contentSize).toBe(3);
      expect(mem.totalSize).toBe(5); // 1 (id) + 1 (size) + 3 (content)
    });

    it("parses module with multiple sections", () => {
      const wasm = [
        ...WASM_HEADER,
        // Type section
        Section.Type,
        0x04,
        0x01,
        0x60,
        0x00,
        0x00,
        // Memory section
        Section.Memory,
        0x03,
        0x01,
        0x00,
        0x01,
      ];
      const sections = parseWasmSections(wasm);

      expect(sections.has(Section.Type)).toBe(true);
      expect(sections.has(Section.Memory)).toBe(true);
      expect(sections.get(Section.Type)!.offset).toBe(8);
      expect(sections.get(Section.Memory)!.offset).toBe(14);
    });

    it("throws on invalid header", () => {
      expect(() => parseWasmSections([0, 0, 0, 0])).toThrow("Invalid WASM header");
    });
  });
});
