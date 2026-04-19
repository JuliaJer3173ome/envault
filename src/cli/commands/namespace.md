# namespace

Manage key namespaces within a vault. Namespaces help organize environment variables by prefixing keys with a consistent identifier.

## Usage

```bash
envault namespace add <vault> <namespace> [options]
envault namespace strip <vault> <namespace> [options]
```

## Commands

### `namespace add`

Prefixes all existing keys in the vault with `<namespace>_`.

```bash
envault namespace add .vault PROD
# KEY=value  →  PROD_KEY=value
```

### `namespace strip`

Removes the `<namespace>_` prefix from all matching keys. Keys without the prefix are left unchanged.

```bash
envault namespace strip .vault PROD
# PROD_KEY=value  →  KEY=value
```

## Options

| Flag | Description |
|------|-------------|
| `-p, --password` | Vault password (prompted if omitted) |

## Examples

```bash
# Add staging namespace
envault namespace add staging.vault STAGING -p mypassword

# Strip namespace before exporting
envault namespace strip staging.vault STAGING
envault export staging.vault -p mypassword > .env
```

## Notes

- Namespace values are uppercased by convention but not enforced.
- Applying a namespace twice will double-prefix keys.
- Use `envault keys` to inspect keys before and after.
