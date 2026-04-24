# `group` Command

Display vault entries grouped by their key prefix (the portion before the first `_`).

## Usage

```bash
envault group <vault> [options]
```

## Arguments

| Argument | Description              |
|----------|--------------------------|
| `vault`  | Path to the vault file   |

## Options

| Option                  | Description                             |
|-------------------------|-----------------------------------------|
| `-p, --password <pwd>`  | Vault password (prompted if omitted)    |
| `--prefix <prefix>`     | Filter output to a specific group only  |
| `--json`                | Output grouped entries as JSON          |

## Examples

### Display all groups

```bash
envault group .env.vault -p mypassword
```

Output:
```
[DB]
  DB_HOST=localhost
  DB_PORT=5432

[APP]
  APP_NAME=envault
  APP_ENV=production
```

### Filter to a single group

```bash
envault group .env.vault -p mypassword --prefix DB
```

### Output as JSON

```bash
envault group .env.vault -p mypassword --json
```

## Notes

- Keys without an underscore are placed in their own single-key group named after themselves.
- Grouping is based on the **first** underscore delimiter only (`DB_HOST_REPLICA` → group `DB`).
- Combine with `--prefix` and `--json` for scripting and automation use cases.
