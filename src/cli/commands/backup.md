# `backup` Command

Creates a timestamped backup copy of an existing vault file without decrypting it.

## Usage

```bash
envault backup <vault> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the vault file to back up |

## Options

| Option | Description |
|--------|-------------|
| `-l, --label <label>` | Optional label embedded in the backup filename |
| `-o, --output <path>` | Custom output path for the backup file |

## Examples

```bash
# Basic backup with auto-generated timestamp
envault backup secrets.vault
# => secrets.backup-2024-06-01T12-00-00-000Z.vault

# Backup with a descriptive label
envault backup secrets.vault --label pre-deploy
# => secrets.backup-pre-deploy-2024-06-01T12-00-00-000Z.vault

# Backup to a specific path
envault backup secrets.vault --output /backups/secrets-snapshot.vault
```

## Notes

- The vault is copied as-is; no decryption or password is required.
- The command will fail if the destination file already exists to prevent accidental overwrites.
- Backups retain full encryption and can be opened with the original password.
