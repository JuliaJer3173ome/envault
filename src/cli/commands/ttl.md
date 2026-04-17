# TTL Command

The `ttl` command allows you to set an expiry time on individual keys within a vault. After the TTL elapses, the key is considered expired and can be purged.

## Usage

### Set a TTL on a key

```bash
envault ttl <vault> <key> <seconds>
```

**Arguments:**
- `vault` — Path to the `.vault` file
- `key` — The key to apply the TTL to
- `seconds` — Number of seconds until the key expires

**Example:**
```bash
envault ttl secrets.vault SESSION_TOKEN 3600
# TTL set for "SESSION_TOKEN": expires at 2024-01-01T01:00:00.000Z
```

### Purge expired keys

```bash
envault ttl-purge <vault>
```

Removes all keys from the vault whose TTL has elapsed. You will be prompted for the vault password.

**Example:**
```bash
envault ttl-purge secrets.vault
# Password: ****
# Purged 2 expired key(s): SESSION_TOKEN, TEMP_API_KEY
```

## Notes

- TTL metadata is stored in a `.envault-ttl.json` file alongside the vault.
- The vault contents are **not** automatically purged — you must run `ttl-purge` explicitly or integrate it into your workflow.
- Setting a TTL on a key that already has one will overwrite the previous expiry.
- TTLs are per-vault, so the same key name in different vaults has independent expiry.
