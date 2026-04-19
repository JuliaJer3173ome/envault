# `cat` Command

Print one or more entries from a vault in `KEY=VALUE` format.

## Usage

```bash
envault cat <vault> [options]
```

## Arguments

| Argument | Description              |
|----------|--------------------------|
| `vault`  | Path to the vault file   |

## Options

| Option                  | Description                                      |
|-------------------------|--------------------------------------------------|
| `-p, --password <pass>` | Vault password (prompted if not provided)        |
| `-k, --keys <keys>`     | Comma-separated list of keys to print            |

## Examples

### Print all entries

```bash
envault cat my.vault -p mypassword
```

Output:
```
API_KEY=abc123
DB_URL=postgres://localhost/mydb
SECRET=topsecret
```

### Print specific keys

```bash
envault cat my.vault -p mypassword -k API_KEY,DB_URL
```

Output:
```
API_KEY=abc123
DB_URL=postgres://localhost/mydb
```

## Notes

- If `--keys` is omitted, all entries are printed.
- Keys not present in the vault are silently skipped.
- Output is suitable for piping into shell scripts or other tools.
