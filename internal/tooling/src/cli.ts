/**
 * Minimal CLI runner that executes the given async main function and exits
 * with its returned numeric code. Errors default to exit code 2.
 */
export async function runCli(main: () => Promise<number>): Promise<void> {
  try {
    const code = await main();
    process.exit(code);
  } catch (error) {
    console.error(error);
    process.exit(2);
  }
}
