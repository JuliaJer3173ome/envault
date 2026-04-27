# `zip` Command

Interleave entries from two vaults into a new output vault.

## Usage

```bash
envault zip <vaultA> <vaultB> <output> [options]
```

## Arguments

| Argument  | Description                          |
|-----------|--------------------------------------|
| `vaultA`  | Path to the first source vault       |
| `vaultB`  | Path to the second source vault      |
| `output`  | Path for the resulting output vault  |

## Options

| Flag                    | Description                        |
|-------------------------|------------------------------------|
| `-p, --password <pwd>`  | Password for all vaults            |

## Description

The `zip` command reads entries from two vaults and interleaves them in
alternating order — first an entry from vault A, then one from vault B,
and so on. If one vault has more entries than the other, the remaining
entries are appended at the end.

All three vaults (A, B, and output) must share the same password.

## Example

```bash
# Zip staging and production vaults into a combined vault
envault zip staging.vault production.vault combined.vault -p mypassword
```

## Notes

- Key conflicts are resolved by last-write wins (vault B keys overwrite
  vault A keys with the same name during interleaving).
- The output vault is created or overwritten if it already exists.
