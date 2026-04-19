# `truncate` Command

Remove multiple keys from a vault in a single operation.

## Usage

```bash
envault truncate <vault> <keys...> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the `.vault` file |
| `keys`   | One or more key names to remove |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Vault password (prompted if omitted) |
| `-y, --yes` | Skip confirmation prompt |

## Examples

```bash
# Remove a single key
envault truncate secrets.vault API_KEY --password mypass --yes

# Remove multiple keys interactively
envault truncate secrets.vault DB_HOST DB_PORT DB_PASS

# Remove keys with inline password and auto-confirm
envault truncate prod.vault OLD_TOKEN LEGACY_URL -p hunter2 -y
```

## Notes

- Keys that do not exist in the vault are reported as warnings but do not cause failure.
- If **all** specified keys are missing, no write occurs and a message is printed.
- Without `--yes`, you will be asked to confirm before deletion.
