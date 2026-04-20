# `envault default`

Show or highlight the default key in a vault.

## Usage

```bash
envault default <vault> [options]
```

## Arguments

| Argument | Description          |
|----------|----------------------|
| `vault`  | Path to the vault file |

## Options

| Option                  | Description                              |
|-------------------------|------------------------------------------|
| `-p, --password <pass>` | Vault password (prompted if omitted)     |
| `-s, --set <key>`       | Display a specific key as the default    |

## Behavior

Without `--set`, the command auto-detects a "default" key by checking for common
names in order: `DEFAULT`, `APP_ENV`, `NODE_ENV`, `ENVIRONMENT`, `ENV`.
If none match, the first key in the vault is used.

With `--set <key>`, the specified key's value is displayed prominently.

## Examples

```bash
# Auto-detect and show the default key
envault default my.vault -p secret

# Show a specific key as the default
envault default my.vault -p secret --set DATABASE_URL
```

## Output

```
Default key: NODE_ENV
Value: production
```
