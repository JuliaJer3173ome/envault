# `pin` Command

The `pin` command lets you save shorthand aliases for vault file paths, so you don't need to type full paths every time.

## Subcommands

### `pin add <alias> <vaultPath>`
Save a vault path under a short alias.

```bash
envault pin add myapp ./vaults/myapp.vault
```

### `pin remove <alias>`
Remove a previously saved alias.

```bash
envault pin remove myapp
```

### `pin list`
List all currently pinned aliases and their resolved paths.

```bash
envault pin list
# myapp -> /home/user/project/vaults/myapp.vault
# staging -> /home/user/project/vaults/staging.vault
```

## Storage

Pins are stored in `~/.envault_pins.json` on the local machine. This file is user-specific and not intended to be committed to version control.

## Usage with Other Commands

In future versions, pinned aliases can be used directly in place of vault paths:

```bash
envault get myapp DB_URL
# resolves "myapp" to its pinned path automatically
```
