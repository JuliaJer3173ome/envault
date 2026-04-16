# `envault clone` Command

Clone an existing vault to a new location, optionally re-encrypting it with a different password.

## Usage

```bash
envault clone <source> <destination> [options]
```

## Arguments

| Argument      | Description                        |
|---------------|------------------------------------|
| `source`      | Path to the source `.vault` file   |
| `destination` | Path for the new cloned vault file |

## Options

| Option                        | Description                              |
|-------------------------------|------------------------------------------|
| `-p, --password <password>`   | Password for the source vault            |
| `-n, --new-password <pass>`   | New password for the cloned vault        |

## Examples

### Clone with the same password
```bash
envault clone production.vault staging.vault
```

### Clone with a new password
```bash
envault clone production.vault staging.vault --new-password newSecret
```

## Notes

- The destination file must not already exist.
- All entries from the source vault are copied into the new vault.
- If `--new-password` is omitted, the source password is reused.
- Passwords can be passed as flags or entered interactively.
