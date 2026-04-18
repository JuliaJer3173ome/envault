# `resolve` Command

Resolve a template string by substituting values from a vault.

## Usage

```bash
envault resolve <vault> <template> [options]
```

## Arguments

| Argument   | Description                              |
|------------|------------------------------------------|
| `vault`    | Path to the encrypted vault file         |
| `template` | Template string with `${KEY}` placeholders |

## Options

| Flag                  | Description              |
|-----------------------|--------------------------|
| `-p, --password <pw>` | Vault password (prompted if omitted) |

## Examples

```bash
# Resolve a database URL from vault values
envault resolve .vault 'postgres://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}' -p secret
# => postgres://admin:hunter2@localhost/mydb

# Unknown keys are left as-is
envault resolve .vault '${UNKNOWN_KEY}' -p secret
# => ${UNKNOWN_KEY}
```

## Notes

- Template syntax uses `${KEY}` placeholders.
- Keys not found in the vault are preserved verbatim.
- Useful for constructing connection strings or config values dynamically.
