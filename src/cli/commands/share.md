# `share` Command

Export a subset of vault entries into a new encrypted bundle that can be safely shared with teammates.

## Usage

```
envault share <vault> <output> [options]
```

## Arguments

| Argument | Description                        |
|----------|------------------------------------|
| vault    | Path to the source vault file      |
| output   | Path for the new share bundle file |

## Options

| Flag                          | Description                                      |
|-------------------------------|--------------------------------------------------|
| `-k, --keys <keys>`           | Comma-separated list of keys to include          |
| `-p, --password <password>`   | Source vault password (prompted if omitted)      |
| `-P, --share-password <pass>` | Password for the output bundle (prompted if omitted) |

## Examples

```bash
# Share all keys
envault share .vault.enc shared.enc

# Share specific keys
envault share .vault.enc shared.enc --keys API_KEY,STRIPE_KEY

# Non-interactive
envault share .vault.enc shared.enc -p mypass -P sharepass -k DB_URL
```

## Notes

- The output bundle is a standard envault vault file and can be opened with `envault get`, `envault list`, etc.
- The share password is independent of the source vault password.
- If `--keys` is omitted, all entries are included.
