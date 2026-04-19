# `encode` Command

Encode or decode values stored in a vault using Base64 or Hex encoding.

## Usage

```
envault encode <vault> [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-k, --keys <keys>` | Comma-separated list of keys to process | all keys |
| `-e, --encoding <enc>` | Encoding format: `base64` or `hex` | `base64` |
| `-d, --decode` | Decode values instead of encoding | false |

## Examples

### Encode all values in Base64
```bash
envault encode myapp.vault
```

### Encode specific keys in Hex
```bash
envault encode myapp.vault --keys API_KEY,SECRET --encoding hex
```

### Decode Base64 values
```bash
envault encode myapp.vault --decode
```

### Decode specific keys
```bash
envault encode myapp.vault --keys TOKEN --decode
```

## Notes

- Encoding is applied in-place; the vault is updated after processing.
- If a value cannot be decoded (malformed input), it is left unchanged.
- Useful for storing binary-safe or obfuscated values in a vault.
