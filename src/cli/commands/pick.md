# `pick` Command

Keep only the specified keys in a vault, removing all others. This is the inverse of the `omit` command.

## Usage

```bash
envault pick <vault> <keys...> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the vault file |
| `keys`   | One or more keys to keep |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Vault password (prompted if omitted) |
| `--dry-run` | Preview which keys would be kept/removed without modifying the vault |

## Examples

### Keep specific keys

```bash
envault pick secrets.vault DB_HOST DB_PORT DB_NAME
```

### Preview changes before applying

```bash
envault pick secrets.vault API_KEY --dry-run
```

### Provide password inline

```bash
envault pick secrets.vault NODE_ENV PORT --password mypassword
```

## Notes

- Keys not found in the vault will produce a warning but will not cause the command to fail.
- Use `--dry-run` to safely inspect which keys would be retained or removed before committing.
- See also: [`omit`](./omit.md) to remove specific keys instead of keeping them.
