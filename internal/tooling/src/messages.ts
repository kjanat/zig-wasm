/** Type representing a usage message. */
export type UsageMessage = string[] | string;
/** Type representing the severity status. */
export type SeverityStatus = "info" | "warning" | "error";

const printers: Record<SeverityStatus, typeof console.log> = {
  info: console.log,
  warning: console.warn,
  error: console.error,
};

/**
 * Print a usage message to the console.
 * @param usage The message to print
 * @param status The severity
 * @defaults info
 */
export const printHelp = (usage: UsageMessage, status: SeverityStatus = "info") => {
  const print = printers[status];
  print(Array.isArray(usage) ? usage.join("\n") : usage);
};

export const CHECK_PUBLISHED_USAGE: UsageMessage = [
  "check-published - Check if a package version is already published on npm",
  "",
  "Usage: check-published <package-path-or-name>",
  "       check-published --help | -h",
  "",
  "Arguments:",
  "  <package-path-or-name>  Package identifier (scoped name, short name, or path)",
  "",
  "Examples:",
  "  check-published crypto              # Short name",
  "  check-published @zig-wasm/crypto    # Scoped name",
  "  check-published ./packages/crypto   # Relative path",
  "",
  "Exit codes:",
  "  0 - Package version is published (or --help)",
  "  1 - Package version is NOT published",
  "  2 - Error occurred",
];

export const SYNC_VERSIONS_USAGE: UsageMessage = [
  "sync-versions - Sync versions between package.json and jsr.json",
  "",
  "Usage: sync-versions [--check]",
  "       sync-versions --help | -h",
  "",
  "Options:",
  "  --check  Report mismatches without modifying files (CI mode)",
  "  --help   Show this help message",
  "",
  "Examples:",
  "  sync-versions          # Sync all versions",
  "  sync-versions --check  # Check for mismatches (CI)",
  "",
  "Exit codes:",
  "  0 - All versions in sync (or successfully synced)",
  "  1 - Mismatches found (--check) or sync failed",
];
