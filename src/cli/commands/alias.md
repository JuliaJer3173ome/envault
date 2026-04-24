# `alias` Command

Manage short aliases for vault file paths so you don't have to type full paths repeatedly.

Aliases are stored in `~/.envault/aliases.json`.

## Subcommands

### `alias set <alias> <vault>`

Create or update an alias pointing to a vault path.

```bash
envault alias set prod /home/user/vaults/production.vault
```

### `alias remove <alias>`

Delete an alias.

```bash
envault alias remove prod
```

Exits with code 1 if the alias does not exist.

### `alias list`

Print all defined aliases and their resolved paths.

```bash
envault alias list
# prod -> /home/user/vaults/production.vault
# dev  -> /home/user/vaults/dev.vault
```

### `alias resolve <alias>`

Print the resolved vault path for a given alias. Useful in scripts.

```bash
VAULT=$(envault alias resolve prod)
envault get API_KEY --vault "$VAULT"
```

Exits with code 1 if the alias is not found.

## Notes

- Paths are stored as absolute paths (resolved at time of `alias set`).
- Aliases are global to the current user, not per-project.
- Other commands do **not** automatically resolve aliases; use `alias resolve` in scripts to obtain the path first.
