/**
 * Minimal CLI runner that executes the given async main function and sets
 * process.exitCode to its returned numeric code. Errors default to exit code 2.
 * Uses process.exitCode instead of process.exit() to allow graceful shutdown.
 */
export async function runCli(main: () => Promise<number>): Promise<void> {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 2;
  }
}
