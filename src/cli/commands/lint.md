# `envault lint`

Lint vault entries for common issues such as invalid key names, empty values, or oversized entries.

## Usage

```bash
envault lint <vault> --password <password> [--strict] [--format <format>]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the vault file |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password` | Vault password |
| `--strict` | Exit with non-zero code on warnings (in addition to errors) |
| `--format` | Output format: `text` (default) or `json` |

## Rules

| Severity | Rule |
|----------|------|
| `warn`   | Key is not uppercase |
| `error`  | Key contains whitespace |
| `error`  | Key contains invalid characters |
| `warn`   | Value is empty |
| `warn`   | Value exceeds 1024 characters |

## Examples

```bash
# Lint a vault
envault lint .env.vault --password mysecret

# Lint with strict mode (warnings also cause non-zero exit)
envault lint .env.vault --password mysecret --strict

# Output results as JSON (useful for CI pipelines or tooling)
envault lint .env.vault --password mysecret --format json
```

## Exit Codes

- `0` — No issues found (or only warnings without `--strict`)
- `1` — Errors found, or warnings found with `--strict`
