# compress

The `compress` command allows you to pack and unpack vault files using gzip compression. This is useful for reducing storage size or preparing vaults for transfer.

## Subcommands

### `envault compress pack <vault>`

Compresses the specified vault file and saves it as `<vault>.gz`.

```bash
envault compress pack secrets.vault
# => Compressed vault saved to: secrets.vault.gz
```

### `envault compress unpack <file>`

Decompresses a `.gz` vault file and restores the original vault.

```bash
envault compress unpack secrets.vault.gz
# => Decompressed vault saved to: secrets.vault
```

## Notes

- The original file is **not** deleted after compression or decompression.
- Only files with a `.gz` extension can be unpacked.
- Compressed vaults remain encrypted; compression does not affect security.
- Useful in combination with `backup` for efficient storage:

```bash
envault backup secrets.vault
envault compress pack secrets.vault.bak
```
