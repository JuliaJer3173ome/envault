# `intersect` Command

Show the keys (and their values from vault A) that are common to two vaults.

## Usage

```bash
envault intersect <vaultA> <vaultB> [options]
```

## Arguments

| Argument | Description              |
|----------|--------------------------|
| vaultA   | Path to the first vault  |
| vaultB   | Path to the second vault |

## Options

| Flag                  | Description                                          |
|-----------------------|------------------------------------------------------|
| `-p, --password <pw>` | Password used to decrypt both vaults                 |
| `-v, --values`        | Only include keys where the values also match        |
| `--json`              | Output the result as a JSON object                   |

## Examples

```bash
# Show all keys present in both vaults
envault intersect staging.vault production.vault -p secret

# Only show keys that share the same value in both vaults
envault intersect staging.vault production.vault -p secret --values

# Output as JSON
envault intersect staging.vault production.vault -p secret --json
```

## Notes

- Values in the output are always taken from **vault A**.
- Both vaults must be decryptable with the same password.
- Use `diff` to see keys that differ between two vaults.
- Use `merge` to combine entries from two vaults into one.
