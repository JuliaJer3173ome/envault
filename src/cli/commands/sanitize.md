# `sanitize` Command

Removes entries with empty, null, or undefined values from a vault.

## Usage

```bash
envault sanitize <vault> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the vault file |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Vault password |
| `--dry-run` | Preview changes without applying them |

## Examples

```bash
# Sanitize a vault interactively
envault sanitize secrets.vault -p mypassword

# Preview what would be removed
envault sanitize secrets.vault -p mypassword --dry-run
```

## Behavior

- Removes entries whose values are `""`, `"null"`, or `"undefined"` (after trimming whitespace)
- Trims leading/trailing whitespace from all retained values
- With `--dry-run`, prints the list of keys to be removed without modifying the vault
- Reports "No entries to sanitize." if the vault is already clean
