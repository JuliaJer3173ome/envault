# `omit` Command

Remove one or more keys from a vault in a single operation.

## Usage

```bash
envault omit <vault> <keys...> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the `.vault` file |
| `keys`   | One or more key names to remove |

## Options

| Flag | Description |
|------|-------------|
| `-p, --password <password>` | Vault password (or set `ENVAULT_PASSWORD`) |
| `--dry-run` | Preview the result without writing changes |

## Examples

```bash
# Remove a single key
envault omit .env.vault DEBUG --password secret

# Remove multiple keys at once
envault omit .env.vault DEBUG LOG_LEVEL VERBOSE --password secret

# Preview what would be removed
envault omit .env.vault TEMP_KEY --password secret --dry-run
```

## Notes

- Keys that do not exist in the vault are silently ignored.
- Use `--dry-run` to inspect the resulting entries before committing.
- Combine with `extract` to save the omitted keys to a separate vault first.
