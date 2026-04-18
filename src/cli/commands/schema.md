# schema

Validate vault contents against a JSON schema definition.

## Usage

```
envault schema init <schemaPath>
envault schema set <vaultPath> <schemaPath>
```

## Commands

### `schema init <schemaPath>`

Creates an empty schema JSON file at the given path.

### `schema set <vaultPath> <schemaPath>`

Opens the vault and validates all entries against the schema. Exits with code 1 if validation fails.

## Schema Format

```json
{
  "fields": [
    {
      "key": "API_KEY",
      "required": true,
      "description": "Third-party API key",
      "pattern": "^[A-Za-z0-9_-]+$"
    },
    {
      "key": "PORT",
      "required": false,
      "pattern": "^\\d+$"
    }
  ]
}
```

## Fields

| Field | Type | Description |
|---|---|---|
| `key` | string | Environment variable name |
| `required` | boolean | Whether the key must exist in the vault |
| `description` | string | Optional human-readable description |
| `pattern` | string | Optional regex the value must match |

## Example

```bash
envault schema init .envault-schema.json
# edit schema...
envault schema set myapp.vault .envault-schema.json
```
