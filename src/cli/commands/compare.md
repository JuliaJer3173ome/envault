# `compare` Command

Compare two encrypted vaults and display key-level differences.

## Usage

```bash
envault compare <vaultA> <vaultB> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vaultA` | Path to the first vault file |
| `vaultB` | Path to the second vault file |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Shared password for both vaults |

## Output

- Keys **only in vaultA** — present in A but not B
- Keys **only in vaultB** — present in B but not A
- Keys with **different values** — exist in both but values differ
- If no differences: prints `Vaults are identical.`

## Examples

```bash
# Compare two vaults interactively
envault compare staging.vault production.vault

# Compare with password flag
envault compare dev.vault prod.vault --password mysecret
```

## Notes

- Both vaults must use the **same password**.
- Values are **not shown** in output to avoid leaking secrets.
- Use `diff` for a patch-style output; `compare` focuses on key-level summary.
