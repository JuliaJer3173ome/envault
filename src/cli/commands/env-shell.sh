#!/usr/bin/env bash
# envault-env-shell.sh
# Helper script demonstrating common shell integration patterns for `envault env`.

set -euo pipefail

VAULT="${1:-}"
if [[ -z "$VAULT" ]]; then
  echo "Usage: $0 <vault-path> [password]" >&2
  exit 1
fi

PASSWORD="${2:-}"
PASS_ARGS=()
if [[ -n "$PASSWORD" ]]; then
  PASS_ARGS=(--password "$PASSWORD")
fi

# Source all variables into current shell
eval "$(envault env "$VAULT" "${PASS_ARGS[@]:-}")"
echo "Vault variables loaded into shell environment."

# Example: run a command with vault env vars
# envault env "$VAULT" "${PASS_ARGS[@]:-}" --export > /tmp/.envault_tmp
# env $(cat /tmp/.envault_tmp | xargs) your-command
# rm -f /tmp/.envault_tmp
