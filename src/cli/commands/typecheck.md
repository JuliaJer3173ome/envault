# `typecheck` Command

Validate that the values stored in a vault conform to expected types.

## Usage

```bash
envault typecheck <vault> --schema KEY:TYPE [KEY:TYPE ...] [--password <password>]
```

## Supported Types

| Type      | Description                                      |
|-----------|--------------------------------------------------|
| `string`  | Any value (default fallback)                     |
| `number`  | Integer or floating-point numeric value          |
| `boolean` | Exactly `true` or `false`                        |
| `url`     | Value starting with `http://` or `https://`      |
| `date`    | ISO 8601 date or datetime string                 |
| `email`   | Basic email address format                       |

## Options

| Flag                    | Description                              |
|-------------------------|------------------------------------------|
| `-p, --password <pass>` | Password to decrypt the vault            |
| `-s, --schema <pairs>`  | One or more `KEY:TYPE` assertions        |

## Examples

```bash
# Check that PORT is a number and DEBUG is a boolean
envault typecheck .env.vault --schema PORT:number DEBUG:boolean

# Check API_URL is a valid URL
envault typecheck .env.vault -p secret --schema API_URL:url
```

## Exit Codes

- `0` — All checked keys match their expected types.
- `1` — One or more keys failed type validation.

## Notes

- Keys not present in the vault are treated as empty strings (`string` type).
- Type inference is heuristic-based; use `validate` for strict schema enforcement.
