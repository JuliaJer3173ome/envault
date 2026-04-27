# chmod

Manage per-key access permissions within a vault.

## Usage

```bash
envault chmod set <vault> <key> <permission> [--password <password>]
envault chmod revoke <vault> <key> <permission> [--password <password>]
envault chmod show <vault> <key> [--password <password>]
```

## Permissions

- `read` — allow reading the key's value
- `write` — allow modifying the key's value
- `delete` — allow deleting the key

## Examples

```bash
# Grant read permission on API_KEY
envault chmod set .env.vault API_KEY read

# Revoke write permission on DB_PASSWORD
envault chmod revoke .env.vault DB_PASSWORD write

# Show current permissions for SECRET_TOKEN
envault chmod show .env.vault SECRET_TOKEN
```

## Notes

Permissions are stored in a sidecar file alongside the vault.
If no permissions are set for a key, all operations are allowed by default.
Permissions are enforced by other commands that call `checkPermission`.
