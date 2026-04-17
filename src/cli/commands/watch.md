# `watch` Command

Monitor a vault file for changes and detect expired TTL keys in real time.

## Usage

```bash
envault watch <vault> --password <password> [--interval <ms>]
```

## Arguments

| Argument | Description              |
|----------|--------------------------|
| `vault`  | Path to the vault file   |

## Options

| Option                  | Description                                      | Default |
|-------------------------|--------------------------------------------------|---------|
| `-p, --password <pass>` | Password to decrypt the vault                    |         |
| `-i, --interval <ms>`   | Polling interval in milliseconds                 | `5000`  |

## Behavior

- Polls the vault file at the specified interval.
- Logs a message when the vault file is modified on disk.
- Warns about any keys whose TTL has expired (see `ttl` command).

## Example

```bash
# Watch a vault every 10 seconds
envault watch ./team.vault --password secret --interval 10000
```

## Notes

- Requires the vault password; prompting is not supported in watch mode.
- Use `Ctrl+C` to stop watching.
- Works alongside the `ttl` command to surface expiring secrets proactively.
