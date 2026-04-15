# `diff` Command

Compare two vault files and display the differences between their stored keys.

## Usage

```bash
envault diff <vaultA> <vaultB> [options]
```

## Arguments

| Argument | Description                      |
|----------|----------------------------------|
| `vaultA` | Path to the first vault file     |
| `vaultB` | Path to the second vault file    |

## Options

| Flag                    | Description                              |
|-------------------------|------------------------------------------|
| `-p, --password <pass>` | Password used to decrypt both vaults     |

## Output Format

Each line is prefixed with a symbol indicating the type of change:

- `+` **Added** — key exists in `vaultB` but not in `vaultA`
- `-` **Removed** — key exists in `vaultA` but not in `vaultB`
- `~` **Changed** — key exists in both but has a different value

If the vaults are identical, the message `Vaults are identical.` is printed.

## Examples

```bash
# Compare two vaults interactively
envault diff staging.vault production.vault

# Compare using a provided password
envault diff staging.vault production.vault --password mysecret
```

## Notes

- Both vaults must be decryptable with the **same password**.
- Only key names are shown in the diff output — values are never printed.
