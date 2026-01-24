/**
 * Minimal CLI runner that executes the given async main function and sets
 * process.exitCode to its returned numeric code. Errors default to exit code 2.
 * Uses process.exitCode instead of process.exit() to allow graceful shutdown.
 *
 * @param main - The async main function to execute
 * @returns Promise that resolves when execution completes
 *
 * @example
 * ```ts
 * import { runCli } from "@zig-wasm/tooling";
 *
 * runCli(async () => {
 *   console.log("Running CLI");
 *   return 0; // success
 * });
 * ```
 */
export async function runCli(main: () => Promise<number>): Promise<void> {
	try {
		process.exitCode = await main();
	} catch (error) {
		console.error(error instanceof Error ? error : String(error));
		process.exitCode = 2;
	}
}
