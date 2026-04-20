# `patch` Command

Apply a `.env`-formatted patch file to update multiple keys in a vault at once.

## Usage

```
envault patch <vault> <patchfile> [options]
```

## Arguments

| Argument    | Description                              |
|-------------|------------------------------------------|
| `vault`     | Path to the encrypted vault file         |
| `patchfile` | Path to the `.env` file with new values  |

## Options

| Flag                   | Description                                  |
|------------------------|----------------------------------------------|
| `-p, --password <pw>`  | Vault password (prompted if not provided)    |
| `--dry-run`            | Preview changes without writing to the vault |

## Examples

```bash
# Apply a patch file
envault patch production.vault updates.env -p mypassword

# Preview changes first
envault patch production.vault updates.env -p mypassword --dry-run
```

## Patch File Format

The patch file follows standard `.env` syntax:

```
# Update database URL
DB_URL=postgres://newhost/db

# Add a new key
FEATURE_FLAG=true
```

Lines starting with `#` and blank lines are ignored.

## Notes

- Existing keys are overwritten with the values from the patch file.
- New keys are added to the vault.
- Keys not mentioned in the patch file are left unchanged.
- Use `--dry-run` to safely inspect changes before applying them.
