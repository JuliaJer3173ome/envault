# `redact` Command

Redact sensitive values in a vault by replacing them with a placeholder or permanently removing them.

## Usage

```bash
envault redact <vault> <keys...> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the vault file |
| `keys`   | One or more key names to redact |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Vault password |
| `--permanent` | Permanently delete the key instead of masking its value |

## Examples

### Mask a key's value

```bash
envault redact secrets.vault API_KEY --password mypassword
```

This replaces the value of `API_KEY` with `***REDACTED***`.

### Permanently remove keys

```bash
envault redact secrets.vault API_KEY DB_PASSWORD --password mypassword --permanent
```

### Redact multiple keys at once

```bash
envault redact secrets.vault API_KEY SECRET_TOKEN PRIVATE_KEY -p mypassword
```

## Notes

- If a specified key does not exist in the vault, a warning is printed but the command continues.
- Without `--permanent`, the key remains in the vault with value `***REDACTED***`.
- Use `envault export` after redacting to safely share a sanitized version of your vault.
