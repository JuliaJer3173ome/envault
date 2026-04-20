# `swap` Command

Swap the values of two keys within a vault.

## Usage

```
envault swap <vault> <keyA> <keyB> [options]
```

## Arguments

| Argument | Description                  |
|----------|------------------------------|
| `vault`  | Path to the vault file       |
| `keyA`   | First key to swap            |
| `keyB`   | Second key to swap           |

## Options

| Option                  | Description                        |
|-------------------------|------------------------------------|
| `-p, --password <pass>` | Vault password (prompted if omitted) |

## Examples

```bash
# Swap values of DB_HOST and DB_REPLICA
envault swap secrets.vault DB_HOST DB_REPLICA

# With password flag
envault swap secrets.vault API_KEY_OLD API_KEY_NEW --password mypassword
```

## Notes

- Both keys must exist in the vault; otherwise the command exits with an error.
- The swap is atomic: the vault is only written after both values are confirmed present.
- Original insertion order of keys is preserved; only values are exchanged.
