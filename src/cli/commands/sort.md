# `envault sort`

Sort vault entries alphabetically by key.

## Usage

```
envault sort <vault> [options]
```

## Arguments

| Argument | Description          |
|----------|----------------------|
| `vault`  | Path to the vault file |

## Options

| Option                  | Description                          |
|-------------------------|--------------------------------------|
| `-p, --password <pass>` | Vault password                       |
| `-d, --desc`            | Sort in descending order             |
| `--dry-run`             | Print sorted keys without saving     |

## Examples

```bash
# Sort ascending (default)
envault sort secrets.enc -p mypassword

# Sort descending
envault sort secrets.enc -p mypassword --desc

# Preview sorted order without saving
envault sort secrets.enc -p mypassword --dry-run
```

## Notes

- Sorting is case-sensitive and based on Unicode code points.
- Use `--dry-run` to verify the order before committing changes.
