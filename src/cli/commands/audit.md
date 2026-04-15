# `audit` Command

The `audit` command inspects a vault and produces a report for each stored key, including access history, modification timestamps, and associated tags.

## Usage

```bash
envault audit <vault> [options]
```

## Arguments

| Argument | Description                        |
|----------|------------------------------------|
| `vault`  | Path to the `.env.vault` file      |

## Options

| Flag                    | Description                          |
|-------------------------|--------------------------------------|
| `-p, --password <pass>` | Vault password (prompted if omitted) |
| `--json`                | Output results as JSON               |

## Output Fields

Each entry in the audit report includes:

- **Key** — The environment variable name
- **Last Modified** — Timestamp of the most recent history event, or `never`
- **Access Count** — Number of recorded history events for the key
- **Tags** — Tags assigned to the key via `envault tag`

## Examples

```bash
# Interactive password prompt
envault audit .env.vault

# Provide password inline
envault audit .env.vault --password mypassword

# Output as JSON for scripting
envault audit .env.vault --password mypassword --json
```

## Notes

- Audit data is derived from the vault's `.history.json` file. If no history file exists, access counts will be `0` and last modified will show `never`.
- Use `envault history` to view or clear the raw history log.
- Use `envault tag` to add or remove tags from keys.
