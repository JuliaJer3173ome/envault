# `search` Command

Search for keys (and optionally values) within the encrypted vault.

## Usage

```bash
envault search <query> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `query`  | The search string to match against key names (and optionally values) |

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--file <path>` | `-f` | Path to the vault file | `.env.vault` |
| `--values` | `-v` | Also search within entry values | `false` |
| `--password <password>` | `-p` | Vault password (prompted if omitted) | — |

## Examples

### Search by key name

```bash
envault search DATABASE
# Found 2 result(s) for "DATABASE":
#
#   DATABASE_URL
#   DATABASE_HOST
```

### Search keys and values

```bash
envault search localhost --values
# Found 2 result(s) for "localhost":
#
#   DATABASE_URL=postgres://localhost/mydb
#   DATABASE_HOST=localhost
```

### Use a custom vault file

```bash
envault search API --file production.vault
```

## Notes

- The search is **case-insensitive**.
- By default only **key names** are searched. Use `--values` to include values.
- The vault password will be **prompted interactively** if not provided via `--password`.
