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
	if [[ "${DEBUG:-}" == "1" || -n "${CI:-}" ]]; then
		printf "%bDEBUG: %-18s %s%b\n" "${DIM_CODE}" "$1" "$2" "${RESET_CODE}" >&2
	fi
}

# Redact sensitive argument values for safe logging
redact_args() {
	local result=()
	local skip_next=false
	for arg in "$@"; do
		if [[ "${skip_next}" == true ]]; then
			result+=("<REDACTED>")
			skip_next=false
		elif [[ "${arg}" =~ ^(--password|--pass|--token|--api-key|--secret|--key|--auth|-p)= ]]; then
			# Handle --flag=value format
			result+=("${arg%%=*}=<REDACTED>")
		elif [[ "${arg}" =~ ^(--password|--pass|--token|--api-key|--secret|--key|--auth|-p)$ ]]; then
			# Handle --flag value format (redact next arg)
			result+=("${arg}")
			skip_next=true
		else
			result+=("${arg}")
		fi
	done
	echo "${result[*]}"
}

{
	debug "Source:" "$0"
	debug "Script path:" "./src/${SCRIPT}.ts"
	cwd=$(pwd)
	debug "Current directory:" "${cwd}"
	redacted=$(redact_args "$@")
	debug "Arguments:" "${redacted}"
}

if command -v bun &>/dev/null; then
	debug "Runtime:" "bun"
	exec bun --bun "./src/${SCRIPT}.ts" "$@"
elif command -v deno &>/dev/null; then
	debug "Runtime:" "deno"
	exec deno run --allow-read --allow-env --allow-net=registry.npmjs.org "./src/${SCRIPT}.ts" "$@"
elif command -v node &>/dev/null; then
	debug "Runtime:" "node"
	if [[ -f "./dist/src/${SCRIPT}.mjs" ]]; then
		exec node "./dist/src/${SCRIPT}.mjs" "$@"
	else
		echo "ERROR: dist not built. Run 'pnpm run build' first." >&2
		exit 2
	fi
else
	echo "ERROR: No JavaScript runtime found (bun, deno, or node)" >&2
	exit 2
fi
