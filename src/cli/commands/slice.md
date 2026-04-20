# `slice` Command

Extract a subset of vault entries by positional index range.

## Usage

```
envault slice <vault> <start> [end] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the vault file |
| `start`  | Start index (inclusive, zero-based) |
| `end`    | End index (exclusive, optional) |

## Options

| Flag | Description |
|------|-------------|
| `-p, --password <password>` | Vault password |
| `--in-place` | Overwrite the vault with sliced entries |

## Examples

```bash
# Print entries at index 0 and 1
envault slice .env.vault 0 2 -p mypassword

# Keep only the first 5 entries in the vault
envault slice .env.vault 0 5 -p mypassword --in-place

# Print all entries from index 3 onward
envault slice .env.vault 3 -p mypassword
```

## Notes

- Indices follow JavaScript `Array.prototype.slice` semantics.
- Without `--in-place`, entries are printed to stdout as `KEY=VALUE` pairs.
- The vault is not modified unless `--in-place` is specified.
