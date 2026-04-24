# `freeze` Command

The `freeze` command allows you to mark specific keys in a vault as **frozen**, preventing accidental modification or deletion.

## Usage

```bash
# Freeze a key
envault freeze <vault> <key>

# Unfreeze a key
envault freeze <vault> <key> --unfreeze

# List all frozen keys in a vault
envault freeze <vault> <key> --list
```

## Arguments

| Argument | Description                    |
|----------|--------------------------------|
| `vault`  | Path to the vault file         |
| `key`    | The key to freeze or unfreeze  |

## Options

| Option       | Description                        |
|--------------|------------------------------------|
| `--unfreeze` | Remove the freeze from a key       |
| `--list`     | List all currently frozen keys     |

## How It Works

Frozen keys are tracked in a `.envault-freeze` file stored alongside the vault. Commands like `set`, `delete`, `rename-key`, and `rotate` should check `isFrozen()` before mutating a key.

## Example

```bash
# Protect a production secret from being overwritten
envault freeze ./prod.vault DATABASE_URL

# Verify the key is protected
envault freeze ./prod.vault DATABASE_URL --list

# Remove protection when a rotation is needed
envault freeze ./prod.vault DATABASE_URL --unfreeze
```

## Notes

- Freezing a key that is already frozen is a no-op.
- The `.envault-freeze` file is plain JSON and can be committed to version control to enforce key protection across teams.
