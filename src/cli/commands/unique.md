# `unique` Command

Filter or inspect vault entries based on value uniqueness.

## Usage

```bash
envault unique <vault> [options]
```

## Arguments

| Argument | Description          |
|----------|----------------------|
| `vault`  | Path to the vault file |

## Options

| Option                  | Description                          |
|-------------------------|--------------------------------------|
| `-p, --password <pass>` | Password to decrypt the vault        |
| `--duplicates`          | Show only keys that share a value    |

## Examples

### Print entries with unique values

```bash
envault unique .env.vault -p secret
# KEY1=value1
# KEY3=value3
```

### Find duplicate values

```bash
envault unique .env.vault -p secret --duplicates
# Value "sharedvalue" shared by: KEY1, KEY2
```

## Notes

- When filtering unique entries, only the **first** key for each value is kept.
- Useful for auditing vaults that may have redundant or copy-pasted secrets.
