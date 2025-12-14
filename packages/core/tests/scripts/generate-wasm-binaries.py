#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.14"
# dependencies = [
#     "argcomplete~=3.6",
#     "rich~=14.2",
# ]
# ///
"""
Generate and validate WASM binary test fixtures.

This script generates hand-crafted WASM binaries used in test-utils.ts for
testing the @zig-wasm/core package's WASM loading and panic handling.

The generated module structure:
    - Imports: env._panic(i32, i32) -> void
    - Exports: memory (1 page), doPanic() -> void
    - doPanic calls _panic(100, 10) to trigger panic handling

Validation:
    - LEB128 encoding correctness (signed and unsigned)
    - Section size calculations match parsed binary
    - Critical byte sequences at expected offsets
    - Cross-validation against wat2wasm (if available)

Usage:
    ./generate-wasm-binaries.py              # Full output with TypeScript + hexdump
    ./generate-wasm-binaries.py --validate   # Validation only, no code output
    uv run --script generate-wasm-binaries.py
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from collections.abc import Sequence
from enum import IntEnum
from pathlib import Path
from typing import Final, TypeAlias

import argcomplete  # ty: ignore[unresolved-import]
from rich.console import Console  # ty: ignore[unresolved-import]
from rich.syntax import Syntax  # ty: ignore[unresolved-import]
from rich.table import Table  # ty: ignore[unresolved-import]
from rich.text import Text  # ty: ignore[unresolved-import]

# Type aliases for clarity
Byte: TypeAlias = int  # 0-255
ByteList: TypeAlias = list[Byte]
SectionSizes: TypeAlias = dict[str, int]
ParsedSections: TypeAlias = dict[str, dict[str, int]]

console = Console()

# =============================================================================
# WASM Constants (from WebAssembly spec)
# https://webassembly.github.io/spec/core/binary/modules.html
# =============================================================================


class Section(IntEnum):
    """WASM binary section IDs."""

    TYPE = 1  # Function signatures
    IMPORT = 2  # Import declarations
    FUNCTION = 3  # Function declarations (type indices)
    MEMORY = 5  # Memory declarations
    EXPORT = 7  # Export declarations
    CODE = 10  # Function bodies


class ValType(IntEnum):
    """WASM value types."""

    I32 = 0x7F
    I64 = 0x7E
    F32 = 0x7D
    F64 = 0x7C


class TypeConstructor(IntEnum):
    """WASM type constructors."""

    FUNC = 0x60  # Function type


class Op(IntEnum):
    """WASM opcodes used in this module."""

    I32_CONST = 0x41
    CALL = 0x10
    END = 0x0B


class ExportKind(IntEnum):
    """WASM export descriptor kinds."""

    FUNC = 0x00
    TABLE = 0x01
    MEMORY = 0x02
    GLOBAL = 0x03


class ImportKind(IntEnum):
    """WASM import descriptor kinds."""

    FUNC = 0x00
    TABLE = 0x01
    MEMORY = 0x02
    GLOBAL = 0x03


# WASM magic number and version
WASM_MAGIC: Final[ByteList] = [0x00, 0x61, 0x73, 0x6D]  # \0asm
WASM_VERSION: Final[ByteList] = [0x01, 0x00, 0x00, 0x00]  # version 1


# =============================================================================
# LEB128 Encoding (Little Endian Base 128)
# https://webassembly.github.io/spec/core/binary/values.html#integers
# =============================================================================


def sleb128(value: int) -> ByteList:
    """
    Encode a signed integer as Signed LEB128.

    Each byte holds 7 bits of data + 1 continuation bit. The sign bit (bit 6)
    of the final byte determines if the value is negative.

    Args:
        value: Signed integer to encode

    Returns:
        List of bytes (each 0-255)

    Examples:
        >>> sleb128(0)    # [0x00]
        >>> sleb128(-1)   # [0x7f]
        >>> sleb128(127)  # [0xff, 0x00] - needs extra byte for sign
    """
    result: ByteList = []
    while True:
        byte = value & 0x7F
        value >>= 7
        sign_bit_clear = (byte & 0x40) == 0
        sign_bit_set = (byte & 0x40) != 0
        if (value == 0 and sign_bit_clear) or (value == -1 and sign_bit_set):
            result.append(byte)
            return result
        result.append(byte | 0x80)


def uleb128(value: int) -> ByteList:
    """
    Encode an unsigned integer as Unsigned LEB128.

    Each byte holds 7 bits of data + 1 continuation bit (MSB).
    Continuation bit = 1 means more bytes follow.

    Args:
        value: Non-negative integer to encode

    Returns:
        List of bytes (each 0-255)

    Examples:
        >>> uleb128(0)     # [0x00]
        >>> uleb128(127)   # [0x7f]
        >>> uleb128(128)   # [0x80, 0x01]
    """
    if value < 0:
        raise ValueError(f"uleb128 requires non-negative value, got {value}")
    result: ByteList = []
    while True:
        byte = value & 0x7F
        value >>= 7
        if value == 0:
            result.append(byte)
            return result
        result.append(byte | 0x80)


def decode_uleb128(data: Sequence[int], pos: int) -> tuple[int, int]:
    """
    Decode an Unsigned LEB128 value from a byte sequence.

    Args:
        data: Byte sequence to read from
        pos: Starting position in data

    Returns:
        Tuple of (decoded_value, bytes_consumed)

    Raises:
        ValueError: If LEB128 encoding is unterminated (runs past end of data)
    """
    result = 0
    shift = 0
    consumed = 0
    while pos + consumed < len(data):
        byte = data[pos + consumed]
        consumed += 1
        result |= (byte & 0x7F) << shift
        if (byte & 0x80) == 0:
            return result, consumed
        shift += 7
    raise ValueError(f"Unterminated LEB128 at position {pos}")


# =============================================================================
# WASM Structure Encoding
# =============================================================================


def wasm_string(s: str) -> ByteList:
    """
    Encode a string as WASM name (length-prefixed UTF-8).

    Format: uleb128(byte_length) ++ utf8_bytes
    """
    encoded = s.encode("utf-8")
    return [*uleb128(len(encoded)), *encoded]


def wasm_section(sec_id: Section, content: ByteList) -> ByteList:
    """
    Wrap content in a WASM section.

    Format: section_id ++ uleb128(content_length) ++ content
    """
    return [sec_id, *uleb128(len(content)), *content]


def wasm_vec(items: list[ByteList]) -> ByteList:
    """
    Encode a WASM vector (array with length prefix).

    Format: uleb128(item_count) ++ item[0] ++ item[1] ++ ...
    """
    return [*uleb128(len(items)), *[b for item in items for b in item]]


def count_prefixed(*items: int) -> ByteList:
    """
    Encode items with a raw byte count prefix.

    Shorthand for single-element vectors where count fits in one byte.
    """
    return [len(items), *items]


def func_type(params: list[ValType], results: list[ValType]) -> ByteList:
    """
    Encode a WASM function type signature.

    Format: 0x60 ++ vec(params) ++ vec(results)
    """
    return [
        TypeConstructor.FUNC,
        *uleb128(len(params)),
        *params,
        *uleb128(len(results)),
        *results,
    ]


# =============================================================================
# Build WASM Module
# =============================================================================


def build_wasm_that_calls_panic() -> tuple[ByteList, SectionSizes]:
    """
    Build a minimal WASM module for testing panic handling.

    The module exports a `doPanic` function that calls an imported `_panic`
    function with arguments (100, 10). This is used in @zig-wasm/core tests
    to verify panic message extraction from WASM memory.

    Module structure:
        Section 1 (Type):     [(i32, i32) -> void, () -> void]
        Section 2 (Import):   env._panic : type 0
        Section 3 (Function): doPanic : type 1
        Section 5 (Memory):   1 page (64KB), no maximum
        Section 7 (Export):   memory, doPanic
        Section 10 (Code):    doPanic body

    Returns:
        Tuple of (wasm_bytes, section_sizes) where section_sizes maps
        section names to their byte lengths for validation.
    """
    sizes: SectionSizes = {}

    # WASM header: magic number + version
    header: ByteList = [*WASM_MAGIC, *WASM_VERSION]
    sizes["header"] = len(header)

    # Type section: two function types
    type_sec = wasm_section(
        Section.TYPE,
        wasm_vec([
            func_type([ValType.I32, ValType.I32], []),  # (i32, i32) -> void
            func_type([], []),  # () -> void
        ]),
    )
    sizes["type"] = len(type_sec)

    # Import section: _panic from env
    import_sec = wasm_section(
        Section.IMPORT,
        wasm_vec([
            [*wasm_string("env"), *wasm_string("_panic"), ImportKind.FUNC, 0],
        ]),
    )
    sizes["import"] = len(import_sec)

    # Function section: doPanic uses type index 1
    func_sec = wasm_section(Section.FUNCTION, count_prefixed(1))
    sizes["function"] = len(func_sec)

    # Memory section: 1 page, no max
    mem_sec = wasm_section(
        Section.MEMORY,
        wasm_vec([
            [0x00, 1],  # flags=no_max, initial=1
        ]),
    )
    sizes["memory"] = len(mem_sec)

    # Export section: memory and doPanic
    export_sec = wasm_section(
        Section.EXPORT,
        wasm_vec([
            [*wasm_string("memory"), ExportKind.MEMORY, 0],
            [*wasm_string("doPanic"), ExportKind.FUNC, 1],
        ]),
    )
    sizes["export"] = len(export_sec)

    # Code section: doPanic body
    body = [
        0,  # local declarations count
        Op.I32_CONST,
        *sleb128(100),
        Op.I32_CONST,
        *sleb128(10),
        Op.CALL,
        *uleb128(0),  # Call function index 0 (_panic import)
        Op.END,
    ]
    code_sec = wasm_section(
        Section.CODE,
        wasm_vec([
            [*uleb128(len(body)), *body],
        ]),
    )
    sizes["code"] = len(code_sec)

    wasm = header + type_sec + import_sec + func_sec + mem_sec + export_sec + code_sec
    return wasm, sizes


# =============================================================================
# WASM Parser (for verification)
# =============================================================================

# Map section IDs to human-readable names
SECTION_NAMES: Final[dict[int, str]] = {s.value: s.name.lower() for s in Section}


def parse_wasm_sections(wasm: Sequence[int]) -> ParsedSections:
    """
    Parse a WASM binary and extract section metadata.

    Validates the magic number and version, then iterates through sections
    recording each section's offset and total size (including header).

    Args:
        wasm: WASM binary as a sequence of bytes

    Returns:
        Dict mapping section names to {"offset": int, "total_size": int}

    Raises:
        ValueError: If magic number or version is invalid
    """
    if list(wasm[:4]) != WASM_MAGIC:
        raise ValueError("Invalid WASM magic number")
    if list(wasm[4:8]) != WASM_VERSION:
        raise ValueError("Invalid WASM version (expected 1)")

    sections: ParsedSections = {"header": {"offset": 0, "total_size": 8}}
    pos = 8

    while pos < len(wasm):
        sec_id = wasm[pos]
        sec_len, len_bytes = decode_uleb128(wasm, pos + 1)
        total = 1 + len_bytes + sec_len  # id + length encoding + content

        name = SECTION_NAMES.get(sec_id, f"unknown_{sec_id}")
        sections[name] = {"offset": pos, "total_size": total}
        pos += total

    return sections


# =============================================================================
# Validation Functions
# =============================================================================

# Test vectors for LEB128 validation (value, expected_encoding)
ULEB128_TEST_CASES: Final[list[tuple[int, ByteList]]] = [
    (0, [0x00]),
    (1, [0x01]),
    (127, [0x7F]),  # Max single byte
    (128, [0x80, 0x01]),  # Min two bytes
    (255, [0xFF, 0x01]),
    (256, [0x80, 0x02]),
    (16384, [0x80, 0x80, 0x01]),  # Three bytes
]

SLEB128_TEST_CASES: Final[list[tuple[int, ByteList]]] = [
    (0, [0x00]),
    (1, [0x01]),
    (63, [0x3F]),  # Max positive single byte
    (64, [0xC0, 0x00]),  # Needs sign extension
    (127, [0xFF, 0x00]),  # Needs sign extension
    (-1, [0x7F]),  # All bits set
    (-64, [0x40]),  # Min negative single byte
    (-65, [0xBF, 0x7F]),  # Two bytes negative
]


def _fmt_bytes(data: ByteList) -> str:
    """Format bytes as space-separated hex: [0x00, 0x01] -> '00 01'."""
    return " ".join(f"{b:02x}" for b in data)


def _status(passed: bool) -> Text:
    """Format pass/fail indicator with color."""
    return Text("ok", style="green") if passed else Text("FAIL", style="bold red")


def validate_leb128() -> bool:
    """
    Validate LEB128 encoding functions against known test vectors.

    Tests both unsigned (uleb128) and signed (sleb128) variants against
    hand-verified expected outputs from the WASM spec.
    """
    ok = True

    table = Table(title="LEB128 Encoding", show_header=False, box=None, padding=(0, 1))
    table.add_column("func", style="cyan")
    table.add_column("value", justify="right")
    table.add_column("arrow", style="dim")
    table.add_column("result", style="yellow")
    table.add_column("status")

    for val, expected in ULEB128_TEST_CASES:
        result = uleb128(val)
        passed = result == expected
        ok &= passed
        table.add_row("uleb128", str(val), "->", _fmt_bytes(result), _status(passed))

    for val, expected in SLEB128_TEST_CASES:
        result = sleb128(val)
        passed = result == expected
        ok &= passed
        table.add_row("sleb128", str(val), "->", _fmt_bytes(result), _status(passed))

    console.print(table)
    return ok


def validate_sizes(gen: SectionSizes, parsed: ParsedSections, actual: int) -> bool:
    """
    Validate that generated section sizes match parsed binary.

    Compares sizes from build-time tracking against sizes extracted by
    parsing the completed binary, ensuring consistency.
    """
    table = Table(title="Section Sizes", show_header=False, box=None, padding=(0, 1))
    table.add_column("section", style="cyan")
    table.add_column("size", justify="right")
    table.add_column("unit", style="dim")
    table.add_column("status")

    section_order = ["header", "type", "import", "function", "memory", "export", "code"]
    ok = True
    total = 0

    for name in section_order:
        generated = gen.get(name, 0)
        parsed_size = parsed.get(name, {}).get("total_size", 0)
        total += generated
        passed = generated == parsed_size
        ok &= passed
        table.add_row(name, str(generated), "bytes", _status(passed))

    total_ok = total == actual
    ok &= total_ok
    table.add_row(Text("total", style="bold"), str(total), "bytes", _status(total_ok))

    console.print(table)
    return ok


def validate_bytes(wasm: Sequence[int], parsed: ParsedSections) -> bool:
    """
    Validate critical byte sequences at expected offsets.

    Checks magic number, version, and the function body encoding to catch
    any encoding errors in the generated binary.
    """
    table = Table(title="Byte Sequences", show_header=False, box=None, padding=(0, 1))
    table.add_column("offset", style="dim")
    table.add_column("desc", style="cyan")
    table.add_column("bytes", style="yellow")
    table.add_column("status")

    # Parse code section structure to find body offset (handles multi-byte LEB128)
    code_offset = parsed.get("code", {}).get("offset", 0)
    pos = code_offset + 1  # skip section id
    _, sec_len_bytes = decode_uleb128(wasm, pos)
    pos += sec_len_bytes
    _, func_count_bytes = decode_uleb128(wasm, pos)
    pos += func_count_bytes
    _, body_len_bytes = decode_uleb128(wasm, pos)
    body_offset = pos + body_len_bytes

    # Build expected code body using proper encoding (not hardcoded bytes)
    expected_body = [
        0,  # 0 locals
        Op.I32_CONST,
        *sleb128(100),
        Op.I32_CONST,
        *sleb128(10),
        Op.CALL,
        *uleb128(0),  # call func index 0
        Op.END,
    ]

    checks: list[tuple[int, ByteList, str]] = [
        (0, WASM_MAGIC, "magic"),
        (4, WASM_VERSION, "version"),
        (body_offset, expected_body, "code body"),
    ]

    ok = True
    for offset, expected, desc in checks:
        actual = list(wasm[offset : offset + len(expected)])
        passed = actual == expected
        ok &= passed
        table.add_row(f"@{offset:02x}", desc, _fmt_bytes(actual), _status(passed))

    console.print(table)
    return ok


def validate_against_wat2wasm(our_wasm: ByteList) -> bool | None:
    """
    Cross-validate our binary against wat2wasm output.

    Compiles equivalent WAT source with the WABT toolchain and compares
    byte-for-byte. This catches any encoding errors our hand-written
    binary might have.

    Args:
        our_wasm: The hand-generated WASM binary

    Returns:
        True if exact match, False if mismatch, None if wat2wasm unavailable
    """
    if not shutil.which("wat2wasm"):
        return None

    # Equivalent WAT source for the same module
    wat_source = """\
(module
  (import "env" "_panic" (func $panic (param i32 i32)))
  (memory (export "memory") 1)
  (func (export "doPanic")
    i32.const 100
    i32.const 10
    call $panic))
"""
    with tempfile.TemporaryDirectory() as tmp:
        wat_file = Path(tmp) / "module.wat"
        wasm_file = Path(tmp) / "module.wasm"

        wat_file.write_text(wat_source)
        subprocess.run(
            ["wat2wasm", str(wat_file), "-o", str(wasm_file)],
            check=True,
            capture_output=True,
        )

        reference = list(wasm_file.read_bytes())

    table = Table(
        title="Cross-Validation (wat2wasm)", show_header=False, box=None, padding=(0, 1)
    )
    table.add_column("desc")
    table.add_column("status")

    if our_wasm == reference:
        table.add_row(f"exact match ({len(reference)} bytes)", _status(True))
        console.print(table)
        return True

    # Show differences
    table.add_row(
        f"size: ours={len(our_wasm)}, wat2wasm={len(reference)}", _status(False)
    )
    for i, (a, b) in enumerate(zip(our_wasm, reference, strict=False)):
        if a != b:
            table.add_row(f"first diff @{i:02x}: {a:02x} vs {b:02x}", "")
            break
    console.print(table)
    return False


# =============================================================================
# Output Formatting
# =============================================================================


def format_typescript(wasm: Sequence[int], name: str) -> Syntax:
    """
    Format WASM binary as TypeScript Uint8Array literal.

    Output is suitable for copy-pasting into test-utils.ts.
    Uses syntax highlighting for terminal display.
    """
    lines = [f"// {name} - {len(wasm)} bytes", "return new Uint8Array(["]
    for i in range(0, len(wasm), 12):  # 12 bytes per line for readability
        chunk = ", ".join(f"0x{b:02x}" for b in wasm[i : i + 12])
        lines.append(f"    {chunk},")
    lines.append("]);")
    return Syntax("\n".join(lines), "typescript", theme="monokai")


def format_hexdump(wasm: Sequence[int]) -> Text:
    """
    Format WASM binary as colored hex dump.

    Shows offset, hex bytes, and ASCII representation (16 bytes per line).
    Non-printable characters shown as '.'.
    """
    result = Text()
    for i in range(0, len(wasm), 16):
        chunk = wasm[i : i + 16]
        result.append(f"{i:04x}  ", style="dim")
        result.append(" ".join(f"{b:02x}" for b in chunk).ljust(48), style="yellow")
        result.append(" ")
        ascii_repr = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        result.append(ascii_repr, style="cyan")
        result.append("\n")
    return result


# =============================================================================
# CLI
# =============================================================================


def create_parser() -> argparse.ArgumentParser:
    """Create argument parser with shell completion support."""
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "-v",
        "--validate",
        action="store_true",
        help="Run validation only, skip TypeScript and hexdump output",
    )
    parser.add_argument(
        "-q",
        "--quiet",
        action="store_true",
        help="Suppress all output except errors (implies --validate)",
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable colored output",
    )
    argcomplete.autocomplete(parser)
    return parser


def main() -> int:
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()

    # Handle --no-color
    if args.no_color:
        global console  # noqa: PLW0603
        console = Console(force_terminal=False, no_color=True)

    # --quiet implies --validate
    validate_only = args.validate or args.quiet

    if not args.quiet:
        leb_ok = validate_leb128()
    else:
        # Silent validation
        leb_ok = all(uleb128(v) == e for v, e in ULEB128_TEST_CASES) and all(
            sleb128(v) == e for v, e in SLEB128_TEST_CASES
        )

    wasm, gen_sizes = build_wasm_that_calls_panic()
    parsed = parse_wasm_sections(wasm)

    if not args.quiet:
        console.print(f"\n[bold]WASM Binary[/bold] [dim]({len(wasm)} bytes)[/dim]")
        sizes_ok = validate_sizes(gen_sizes, parsed, len(wasm))
        bytes_ok = validate_bytes(wasm, parsed)

        wat2wasm_ok = validate_against_wat2wasm(wasm)
        if wat2wasm_ok is None:
            console.print(
                "[dim]Cross-Validation (wat2wasm) - skipped (not found)[/dim]"
            )
    else:
        # Silent validation
        sizes_ok = all(
            gen_sizes.get(n, 0) == parsed.get(n, {}).get("total_size", 0)
            for n in [
                "header",
                "type",
                "import",
                "function",
                "memory",
                "export",
                "code",
            ]
        )
        bytes_ok = list(wasm[:4]) == WASM_MAGIC and list(wasm[4:8]) == WASM_VERSION
        wat2wasm_ok = None  # Skip in quiet mode

    if not validate_only:
        console.print("\n" + "=" * 60)
        console.print(format_typescript(wasm, "createWasmThatCallsPanic"))
        console.print()
        console.print(format_hexdump(wasm))

    ok = leb_ok and sizes_ok and bytes_ok and (wat2wasm_ok is not False)

    if not args.quiet:
        if ok:
            console.print("\n[bold green]All validations passed[/bold green]")
        else:
            console.print("\n[bold red]Some validations FAILED[/bold red]")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
