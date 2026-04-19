# `tail` Command

Show the last N entries of an encrypted vault, similar to the Unix `tail` command.

## Usage

```bash
envault tail <vault> [options]
```

## Arguments

| Argument | Description              |
|----------|--------------------------|
| `vault`  | Path to the vault file   |

## Options

| Option                  | Description                          | Default |
|-------------------------|--------------------------------------|---------|
| `-n, --lines <number>`  | Number of entries to show            | `10`    |
| `-p, --password <pass>` | Vault password (prompted if omitted) | —       |

## Examples

```bash
# Show last 10 entries (default)
envault tail my.vault.ev -p secret

# Show last 5 entries
envault tail my.vault.ev -n 5 -p secret
```

## Notes

- Entry order reflects insertion order in the vault.
- Useful for reviewing recently added secrets without listing everything.
