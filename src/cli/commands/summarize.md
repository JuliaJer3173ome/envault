# `summarize` Command

Display a statistical summary of a vault's contents without revealing individual values.

## Usage

```bash
envault summarize <vault> [options]
```

## Arguments

| Argument | Description              |
|----------|--------------------------|
| `vault`  | Path to the vault file   |

## Options

| Flag                    | Description                        |
|-------------------------|------------------------------------|
| `-p, --password <pass>` | Vault password (prompted if omitted) |

## Output Fields

| Field             | Description                                      |
|-------------------|--------------------------------------------------|
| Total keys        | Number of key-value pairs in the vault           |
| Empty values      | Number of keys with an empty string value        |
| Unique values     | Count of distinct values across all entries      |
| Avg value length  | Mean character length of all values              |
| Longest key       | The key with the most characters                 |
| Shortest key      | The key with the fewest characters               |

## Example

```bash
$ envault summarize production.vault -p mypassword
Total keys       : 12
Empty values     : 1
Unique values    : 11
Avg value length : 24
Longest key      : DATABASE_CONNECTION_URL
Shortest key     : PORT
```

## Notes

- No secret values are printed; only metadata is displayed.
- Useful for quickly auditing vault health before a deployment.
