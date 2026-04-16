# `lock` Command

The `lock` command allows you to protect a vault from accidental modifications by locking it. Locked vaults cannot be written to by any envault command that mutates state (e.g., `set`, `delete`, `import`, `rotate`).

## Usage

```bash
envault lock on <vault>      # Lock a vault
envault lock off <vault>     # Unlock a vault
envault lock status <vault>  # Check lock status
```

## Examples

```bash
# Lock the production vault
envault lock on .env.vault

# Check if it's locked
envault lock status .env.vault
# Output: Vault .env.vault is LOCKED

# Unlock when ready to make changes
envault lock off .env.vault
```

## Notes

- Lock state is stored in `~/.envault/locks.json`.
- Locking is local to the machine — it does not modify the vault file itself.
- Other envault commands that mutate a vault will check lock status and abort if locked.
- Use this feature to protect production vaults from accidental edits.
