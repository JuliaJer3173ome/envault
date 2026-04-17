# `env` Command

Print vault entries as `KEY=VALUE` pairs, suitable for shell evaluation or sourcing.

## Usage

```bash
envault env <vault> [options]
```

## Options

| Option | Description |
|---|---|
| `-p, --password <password>` | Vault password (prompted if omitted) |
| `-k, --keys <keys>` | Comma-separated list of keys to include |
| `--export` | Prefix each line with `export` |

## Examples

### Print all entries
```bash
envault env my.vault
```

### Source into current shell
```bash
eval $(envault env my.vault --password secret)
```

### Export specific keys
```bash
envault env my.vault --keys DB_URL,SECRET --export
# export DB_URL=postgres://localhost
# export SECRET=abc123
```

### Use with docker run
```bash
docker run --env-file <(envault env my.vault -p secret) myimage
```

## Notes

- Locked vaults cannot be accessed until unlocked with `envault unlock`.
- Pinned vault aliases are supported as the `<vault>` argument.
