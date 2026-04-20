# `extract` Command

Extract specific keys from a vault into a new vault file or a `.env` file.

## Usage

```bash
envault extract <vault> <keys...> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the source vault file |
| `keys`   | One or more key names to extract |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Vault password (prompted if omitted) |
| `-o, --output <file>` | Output file path |
| `--env` | Output as `.env` format instead of a new vault |

## Examples

### Extract keys into a new vault

```bash
envault extract production.vault DB_HOST DB_PORT -p secret
# Creates: production.extracted.vault
```

### Extract to a custom vault path

```bash
envault extract production.vault DB_HOST DB_PORT -p secret -o db-only.vault
```

### Extract and export as `.env` file

```bash
envault extract production.vault API_KEY API_SECRET --env -o secrets.env -p secret
```

### Print extracted values to stdout

```bash
envault extract production.vault API_KEY --env -p secret
# API_KEY=abc123
```

## Notes

- If none of the specified keys exist in the vault, the command exits with an error.
- When using `--env` without `--output`, values are printed to stdout.
- The extracted vault uses the same password as the source vault.
