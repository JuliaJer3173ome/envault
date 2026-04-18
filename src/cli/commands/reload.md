# `reload` Command

Reload entries from a `.env` file into an existing vault, merging with current keys.

## Usage

```bash
envault reload <vault> <envfile> [options]
```

## Arguments

| Argument  | Description                        |
|-----------|------------------------------------|
| `vault`   | Path to the vault file             |
| `envfile` | Path to the `.env` file to reload  |

## Options

| Option                  | Description                              |
|-------------------------|------------------------------------------|
| `-p, --password <pass>` | Vault password (prompted if not given)   |
| `--overwrite`           | Overwrite existing keys (default: false) |

## Behavior

- By default, only **new** keys from the `.env` file are added; existing vault keys are preserved.
- With `--overwrite`, all keys from the `.env` file replace vault values.
- Comment lines (`#`) and blank lines are ignored.
- Quoted values (single or double) are unquoted automatically.

## Examples

```bash
# Add new keys only
envault reload myvault.env .env -p secret

# Overwrite all keys from file
envault reload myvault.env .env --overwrite -p secret
```
