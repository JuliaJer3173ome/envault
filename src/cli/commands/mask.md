# `mask` Command

Display or persist vault entries with sensitive values masked.

## Usage

```bash
envault mask <vault> <keys...> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the vault file |
| `keys`   | One or more keys whose values should be masked |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Vault password |
| `--write` | Persist the masked values back to the vault |

## Examples

### Display with masking

```bash
envault mask secrets.vault API_KEY DB_PASSWORD --password mypass
```

Output:
```
API_KEY=sk**************9z
DB_PASSWORD=pa******rd
```

### Persist masked values

```bash
envault mask secrets.vault API_KEY --password mypass --write
```

This overwrites the vault with the masked values — useful for sanitizing vaults before sharing.

## Notes

- Values with 4 or fewer characters are replaced entirely with `****`.
- Keys not present in the vault are silently ignored.
