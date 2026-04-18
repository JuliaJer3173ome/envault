# `checksum` Command

The `checksum` command lets you compute and verify the SHA-256 hash of a vault file. This is useful for detecting tampering or confirming integrity before sharing a vault.

## Subcommands

### `envault checksum show <vault>`

Prints the SHA-256 checksum of the specified vault file.

```bash
envault checksum show ./my.vault
# a3f1...  ./my.vault
```

### `envault checksum verify <vault> <expected>`

Verifies that the vault file matches the provided checksum. Exits with code `1` if the checksum does not match.

```bash
envault checksum verify ./my.vault a3f1...
# ✔ Checksum verified successfully.
```

## Use Cases

- **Integrity checks**: Confirm a vault hasn't been modified since it was last trusted.
- **CI pipelines**: Assert vault files are unchanged before deployment.
- **Audit trails**: Record checksums alongside history entries for tamper detection.

## Notes

- The checksum is computed over the raw encrypted bytes of the vault file.
- Changing even a single byte will produce a completely different hash.
- This command does not require a password since it operates on the raw file.
