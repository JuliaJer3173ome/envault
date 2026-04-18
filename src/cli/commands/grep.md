# `grep` Command

Search vault entries using a regular expression pattern.

## Usage

```bash
envault grep <pattern> <vault> [options]
```

## Arguments

| Argument  | Description                        |
|-----------|------------------------------------|
| `pattern` | Regular expression to search with  |
| `vault`   | Path to the vault file             |

## Options

| Option                  | Description                              |
|-------------------------|------------------------------------------|
| `-p, --password <pass>` | Password to decrypt the vault            |
| `-v, --values`          | Also search within values (default: off) |
| `--keys-only`           | Print only matching key names            |

## Examples

```bash
# Find all entries with keys containing "DB"
envault grep DB_ ./secrets.vault --password mypass

# Search both keys and values for "localhost"
envault grep localhost ./secrets.vault --password mypass --values

# Print only key names matching a pattern
envault grep API ./secrets.vault --password mypass --keys-only
```

## Notes

- Patterns are matched case-insensitively.
- The pattern is interpreted as a JavaScript regular expression.
- If no matches are found, a message is displayed and the command exits cleanly.
