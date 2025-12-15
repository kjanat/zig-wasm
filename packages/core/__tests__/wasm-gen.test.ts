import { isValidWasmHeader, parseWasmSections, Section } from "@zig-wasm/core";
import { describe, expect, it } from "vitest";
import {
  createAddFunction,
  createEmptyModule,
  createMinimalWasmWithMemory,
  createWasmThatCallsPanic,
  createWasmWithoutMemory,
  createWasmWithPanicImport,
  getAllInvalidWasm,
} from "./wasm-gen/index.ts";

/**
 * Helper to get ArrayBuffer from Uint8Array.
 * Works around TypeScript strict mode issues with Uint8Array<ArrayBufferLike>.
 */
function toArrayBuffer(wasm: Uint8Array): ArrayBuffer {
  // Create a new ArrayBuffer and copy data to ensure we have a pure ArrayBuffer
  const buffer = new ArrayBuffer(wasm.byteLength);
  new Uint8Array(buffer).set(wasm);
  return buffer;
}

/** Helper to instantiate WASM from Uint8Array with proper typing */
async function instantiate(
  wasm: Uint8Array,
  imports?: WebAssembly.Imports,
): Promise<WebAssembly.Instance> {
  const module = await WebAssembly.compile(toArrayBuffer(wasm));
  return WebAssembly.instantiate(module, imports);
}

/** Helper to compile WASM for rejection tests */
async function compile(wasm: Uint8Array): Promise<WebAssembly.Module> {
  return WebAssembly.compile(toArrayBuffer(wasm));
}

describe("wasm-gen fixtures", () => {
  describe("valid WASM modules", () => {
    describe("createMinimalWasmWithMemory", () => {
      it("produces valid WASM header", () => {
        const wasm = createMinimalWasmWithMemory();
        expect(isValidWasmHeader(wasm)).toBe(true);
      });

      it("has memory section", () => {
        const wasm = createMinimalWasmWithMemory();
        const sections = parseWasmSections(wasm);
        expect(sections.has(Section.Memory)).toBe(true);
      });

      it("has export section", () => {
        const wasm = createMinimalWasmWithMemory();
        const sections = parseWasmSections(wasm);
        expect(sections.has(Section.Export)).toBe(true);
      });

      it("can be instantiated", async () => {
        const wasm = createMinimalWasmWithMemory();
        const instance = await instantiate(wasm);
        expect(instance.exports.memory).toBeInstanceOf(WebAssembly.Memory);
      });
    });

    describe("createWasmWithoutMemory", () => {
      it("produces valid WASM header", () => {
        const wasm = createWasmWithoutMemory();
        expect(isValidWasmHeader(wasm)).toBe(true);
      });

      it("has no memory section", () => {
        const wasm = createWasmWithoutMemory();
        const sections = parseWasmSections(wasm);
        expect(sections.has(Section.Memory)).toBe(false);
      });

      it("has type, function, export, and code sections", () => {
        const wasm = createWasmWithoutMemory();
        const sections = parseWasmSections(wasm);
        expect(sections.has(Section.Type)).toBe(true);
        expect(sections.has(Section.Function)).toBe(true);
        expect(sections.has(Section.Export)).toBe(true);
        expect(sections.has(Section.Code)).toBe(true);
      });

      it("can be instantiated and exports test function", async () => {
        const wasm = createWasmWithoutMemory();
        const instance = await instantiate(wasm);
        expect(instance.exports.test).toBeInstanceOf(Function);
        expect((instance.exports.test as () => number)()).toBe(42);
      });
    });

    describe("createWasmWithPanicImport", () => {
      it("produces valid WASM header", () => {
        const wasm = createWasmWithPanicImport();
        expect(isValidWasmHeader(wasm)).toBe(true);
      });

      it("has import section", () => {
        const wasm = createWasmWithPanicImport();
        const sections = parseWasmSections(wasm);
        expect(sections.has(Section.Import)).toBe(true);
      });

      it("can be instantiated with panic import", async () => {
        const wasm = createWasmWithPanicImport();
        const instance = await instantiate(wasm, {
          env: { _panic: () => {} },
        });
        expect(instance.exports.memory).toBeInstanceOf(WebAssembly.Memory);
      });
    });

    describe("createWasmThatCallsPanic", () => {
      it("produces valid WASM header", () => {
        const wasm = createWasmThatCallsPanic();
        expect(isValidWasmHeader(wasm)).toBe(true);
      });

      it("has all required sections", () => {
        const wasm = createWasmThatCallsPanic();
        const sections = parseWasmSections(wasm);
        expect(sections.has(Section.Type)).toBe(true);
        expect(sections.has(Section.Import)).toBe(true);
        expect(sections.has(Section.Function)).toBe(true);
        expect(sections.has(Section.Memory)).toBe(true);
        expect(sections.has(Section.Export)).toBe(true);
        expect(sections.has(Section.Code)).toBe(true);
      });

      it("can be instantiated and exports doPanic", async () => {
        const wasm = createWasmThatCallsPanic();
        const instance = await instantiate(wasm, {
          env: { _panic: () => {} },
        });
        expect(instance.exports.memory).toBeInstanceOf(WebAssembly.Memory);
        expect(instance.exports.doPanic).toBeInstanceOf(Function);
      });

      it("doPanic calls _panic with correct arguments", async () => {
        const wasm = createWasmThatCallsPanic();
        let capturedArgs: [number, number] | null = null;

        const instance = await instantiate(wasm, {
          env: {
            _panic: (ptr: number, len: number) => {
              capturedArgs = [ptr, len];
            },
          },
        });

        (instance.exports.doPanic as () => void)();
        expect(capturedArgs).toEqual([100, 10]);
      });
    });

    describe("createEmptyModule", () => {
      it("produces valid WASM header", () => {
        const wasm = createEmptyModule();
        expect(isValidWasmHeader(wasm)).toBe(true);
      });

      it("has exactly 8 bytes (header only)", () => {
        const wasm = createEmptyModule();
        expect(wasm.length).toBe(8);
      });

      it("has no sections", () => {
        const wasm = createEmptyModule();
        const sections = parseWasmSections(wasm);
        expect(sections.size).toBe(0);
      });

      it("can be instantiated", async () => {
        const wasm = createEmptyModule();
        const instance = await instantiate(wasm);
        expect(instance).toBeDefined();
      });
    });

    describe("createAddFunction", () => {
      it("produces valid WASM header", () => {
        const wasm = createAddFunction();
        expect(isValidWasmHeader(wasm)).toBe(true);
      });

      it("can be instantiated and add works", async () => {
        const wasm = createAddFunction();
        const instance = await instantiate(wasm);
        const add = instance.exports.add as (a: number, b: number) => number;
        expect(add(2, 3)).toBe(5);
        expect(add(0, 0)).toBe(0);
        expect(add(-5, 10)).toBe(5);
      });
    });
  });

  describe("invalid WASM modules", () => {
    const invalidCases = getAllInvalidWasm();

    it("has multiple invalid variants", () => {
      expect(invalidCases.length).toBeGreaterThan(10);
    });

    it.each(invalidCases.map((c) => [c.reason, c.wasm] as const))(
      "%s is rejected by WebAssembly.compile",
      async (_reason, wasm) => {
        await expect(compile(wasm)).rejects.toThrow();
      },
    );

    describe("header validation", () => {
      it("createInvalidMagic fails header check", () => {
        const { wasm } = invalidCases.find((c) => c.reason.includes("magic"))!;
        expect(isValidWasmHeader(wasm)).toBe(false);
      });

      it("createInvalidVersion fails header check", () => {
        const { wasm } = invalidCases.find((c) => c.reason.includes("version"))!;
        expect(isValidWasmHeader(wasm)).toBe(false);
      });

      it("createTruncatedHeader fails header check", () => {
        const { wasm } = invalidCases.find((c) => c.reason.includes("truncated header"))!;
        expect(isValidWasmHeader(wasm)).toBe(false);
      });

      it("createGarbageBytes fails header check", () => {
        const { wasm } = invalidCases.find((c) => c.reason.includes("garbage"))!;
        expect(isValidWasmHeader(wasm)).toBe(false);
      });

      it("createEmptyBytes fails header check", () => {
        const { wasm } = invalidCases.find((c) => c.reason.includes("empty bytes"))!;
        expect(isValidWasmHeader(wasm)).toBe(false);
      });
    });
  });

  describe("consistency", () => {
    it("all valid modules produce different bytes", () => {
      const modules = [
        createMinimalWasmWithMemory(),
        createWasmWithoutMemory(),
        createWasmWithPanicImport(),
        createWasmThatCallsPanic(),
        createEmptyModule(),
        createAddFunction(),
      ];

      // Compare each pair
      for (let i = 0; i < modules.length; i++) {
        for (let j = i + 1; j < modules.length; j++) {
          const a = modules[i]!;
          const b = modules[j]!;
          const same = a.length === b.length && a.every((v, k) => v === b[k]);
          expect(same).toBe(false);
        }
      }
    });

    it("all invalid modules produce different bytes", () => {
      const invalid = getAllInvalidWasm();

      for (let i = 0; i < invalid.length; i++) {
        for (let j = i + 1; j < invalid.length; j++) {
          const a = invalid[i]!.wasm;
          const b = invalid[j]!.wasm;
          const same = a.length === b.length && a.every((v, k) => v === b[k]);
          if (same) {
            throw new Error(`Duplicate invalid WASM: "${invalid[i]!.reason}" and "${invalid[j]!.reason}"`);
          }
        }
      }
    });

    it("calling builder twice produces identical bytes", () => {
      const builders = [
        createMinimalWasmWithMemory,
        createWasmWithoutMemory,
        createWasmWithPanicImport,
        createWasmThatCallsPanic,
        createEmptyModule,
        createAddFunction,
      ];

      for (const builder of builders) {
        const a = builder();
        const b = builder();
        expect(Array.from(a)).toEqual(Array.from(b));
      }
    });
  });
});
