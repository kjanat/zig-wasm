#!/usr/bin/env bash
#
# Script to use the available JavaScript runtime.
# It prefers bun, then deno, and finally node.

set -euo pipefail

script_dir=$(cd "$(dirname "$0")/.." && pwd)
cd "${script_dir}"

script_basename=$(basename "$0")
SCRIPT="${script_basename%.sh}"

debug() {
	local DIM_CODE RESET_CODE
	DIM_CODE="\033[2m"
	RESET_CODE="\033[0m"
	if [[ "${DEBUG:-}" == "1" ]]; then
		echo -e "${DIM_CODE}DEBUG: $*${RESET_CODE}" >&2
	fi
}

{
	debug "Source:            $0"
	debug "Using script path: ./src/${SCRIPT}.ts"
	debug "Current directory: $(pwd)"
	debug "Arguments:         $*"
}

if command -v bun &>/dev/null; then
	debug "Using bun"
	exec bun --bun "./src/${SCRIPT}.ts" "$@"
elif command -v deno &>/dev/null; then
	debug "No bun found, using deno"
	exec deno run --allow-read --allow-env --allow-net=registry.npmjs.org "./src/${SCRIPT}.ts" "$@"
elif command -v node &>/dev/null; then
	debug "No bun or deno found, using node"
	if [[ -f "./dist/src/${SCRIPT}.mjs" ]]; then
		exec node "./dist/src/${SCRIPT}.mjs" "$@"
	else
		echo "Error: dist not built. Run 'pnpm run build' first." >&2
		exit 1
	fi
else
	echo "Error: No JavaScript runtime found (bun, deno, or node)" >&2
	exit 1
fi
