# `expire` — Key Expiry Management

Set and enforce expiry dates on individual vault keys.

## Commands

### `envault expire <vault> <key> <datetime>`

Assigns an ISO 8601 expiry datetime to a key. The key remains readable until the expiry is enforced via `expire-check`.

**Options**

| Flag | Description |
|------|-------------|
| `-p, --password` | Vault password |

**Example**

```bash
envault expire secrets.vault DB_PASSWORD 2025-12-31T23:59:59Z -p mypassword
```

---

### `envault expire-check <vault>`

Lists all keys that have passed their expiry datetime. Optionally purges them.

**Options**

| Flag | Description |
|------|-------------|
| `-p, --password` | Vault password |
| `--purge` | Remove expired keys from vault and expiry index |

**Example**

```bash
# List expired keys
envault expire-check secrets.vault -p mypassword

# Remove expired keys
envault expire-check secrets.vault --purge -p mypassword
```

## Storage

Expiry metadata is stored alongside the vault in a `.expire.json` sidecar file (e.g. `secrets.expire.json`). This file is unencrypted and contains only key names and ISO timestamps — no secret values.

## Notes

- Expiry is not automatically enforced on `get` — use `expire-check` in CI or cron jobs.
- Purging removes keys permanently; use `snapshot` beforehand if you need recovery.
