# `cast` Command

Cast the value(s) of one or more keys in a vault to a specified type.

## Usage

```bash
envault cast <type> <keys...> -v <vault> -p <password>
```

## Arguments

| Argument | Description |
|----------|-------------|
| `type`   | Target type: `string`, `number`, `boolean`, or `json` |
| `keys`   | One or more key names to cast |

## Options

| Option | Description |
|--------|-------------|
| `-v, --vault <path>` | Path to the vault file |
| `-p, --password <password>` | Vault password |

## Supported Types

- **string** — converts the value to a plain string (no-op for most values)
- **number** — validates and normalises numeric values (`42`, `3.14`)
- **boolean** — converts truthy/falsy strings (`true/false`, `1/0`, `yes/no`, `on/off`) to `"true"` or `"false"`
- **json** — validates existing JSON or wraps a plain string as a JSON string literal

## Examples

```bash
# Cast PORT to a number
envault cast number PORT -v .vault -p secret

# Cast DEBUG to a boolean
envault cast boolean DEBUG -v .vault -p secret

# Cast multiple keys to string
envault cast string HOST PORT -v .vault -p secret

# Cast a value to a JSON string
envault cast json CONFIG -v .vault -p secret
```

## Notes

- If a value cannot be cast to the requested type, the command exits with an error and the vault is **not** modified.
- Casting a value to `string` is always safe and never throws.
