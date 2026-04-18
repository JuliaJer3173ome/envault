# `touch` Command

Create an empty encrypted vault file if one does not already exist at the given path.

## Usage

```bash
envault touch <vault> [options]
```

## Arguments

| Argument | Description                        |
|----------|------------------------------------|
| `vault`  | Path to the vault file to create   |

## Options

| Option                  | Description                              |
|-------------------------|------------------------------------------|
| `-p, --password <pass>` | Password used to encrypt the new vault   |

## Examples

### Create a new vault

```bash
envault touch ./secrets.vault --password mypassword
# Created empty vault: ./secrets.vault
```

### Skip if vault already exists

```bash
envault touch ./secrets.vault --password mypassword
# Vault already exists: ./secrets.vault
```

## Notes

- If no `--password` flag is provided, you will be prompted interactively.
- The command is idempotent: running it on an existing vault is a no-op.
- Useful for initialising vault files in CI pipelines or setup scripts.
