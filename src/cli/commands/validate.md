# `validate` Command

Validate vault entries against a JSON schema file.

## Usage

```bash
envault validate <vault> [options]
```

## Arguments

| Argument | Description              |
|----------|--------------------------|
| `vault`  | Path to the vault file   |

## Options

| Option                  | Description                                              |
|-------------------------|----------------------------------------------------------|
| `-s, --schema <path>`   | Path to schema JSON file (default: `<vault>.schema.json`)|
| `-p, --password <pass>` | Vault password (or set `ENVAULT_PASSWORD`)               |
| `--strict`              | Fail if any key is not defined in the schema             |

## Schema Format

The schema is a JSON object where each key maps to a rule set:

```json
{
  "DATABASE_URL": { "required": true, "type": "string" },
  "PORT":         { "required": false, "type": "number" },
  "DEBUG":        { "type": "boolean" },
  "API_KEY":      { "required": true, "pattern": "^[A-Za-z0-9]{32}$" }
}
```

### Supported Rules

| Rule       | Type      | Description                                      |
|------------|-----------|--------------------------------------------------|
| `required` | `boolean` | Key must be present and non-empty                |
| `type`     | `string`  | One of `string`, `number`, `boolean`             |
| `pattern`  | `string`  | A regular expression the value must match        |

## Examples

```bash
# Validate using default schema path
envault validate production.vault --password secret

# Validate with a custom schema
envault validate production.vault --schema ./schemas/prod.json --password secret

# Strict mode: reject undeclared keys
envault validate production.vault --schema ./schemas/prod.json --strict --password secret
```

## Exit Codes

| Code | Meaning              |
|------|----------------------|
| `0`  | All entries valid    |
| `1`  | One or more failures |
