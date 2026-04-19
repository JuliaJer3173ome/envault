# `placeholder` Command

Replace `{{VAR}}` style placeholders in vault values with runtime variables.

## Usage

```bash
envault placeholder <vault> <key=value...> [options]
```

## Arguments

- `<vault>` — path to the vault file
- `<key=value...>` — one or more variable assignments used to fill placeholders

## Options

| Flag | Description |
|------|-------------|
| `-p, --password <password>` | vault password (prompted if omitted) |
| `--dry-run` | preview replacements without writing to vault |

## Examples

```bash
# Apply placeholders and save
envault placeholder .env.vault HOST=localhost PORT=5432 -p secret

# Preview without saving
envault placeholder .env.vault HOST=prod.example.com --dry-run -p secret
```

## Notes

- Placeholders follow the `{{VAR_NAME}}` syntax.
- Unknown placeholders are left unchanged.
- Use `--dry-run` to verify substitutions before committing.
