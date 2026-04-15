# `info` Command

Displays metadata about an existing vault **without decrypting** its contents. No password is required.

## Usage

```bash
envault info [options]
```

## Options

| Option | Default | Description |
|---|---|---|
| `-v, --vault <path>` | `.envault` | Path to the vault file |

## Output

```
Vault Information
-----------------
Path:       /project/.envault
Keys:       12
Created:    2024-01-15T10:30:00.000Z
Updated:    2024-06-20T08:45:22.000Z
Size:       1024 bytes
```

## Notes

- **No password required** — only the vault file's filesystem metadata and unencrypted header fields are read.
- `Keys` reflects the `keyCount` stored in the vault header, written each time the vault is saved.
- `Created` and `Updated` fall back to filesystem `birthtime` / `mtime` if the vault header does not contain explicit timestamps (e.g. vaults created before v0.2).

## Example

```bash
# Check info for the default vault
envault info

# Check info for a vault in a custom location
envault info --vault ./secrets/production.envault
```
