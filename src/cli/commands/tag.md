# `tag` Command

Add or remove tags on vault entries to help organize and filter your environment variables.

## Usage

```bash
envault tag <key> <tag> [options]
```

## Arguments

| Argument | Description                        |
|----------|------------------------------------|
| `key`    | The environment variable key name  |
| `tag`    | The tag string to add or remove    |

## Options

| Option                  | Description                                  | Default      |
|-------------------------|----------------------------------------------|--------------|
| `-v, --vault <path>`    | Path to the vault file                       | `.envault`   |
| `-p, --password <pass>` | Vault password (prompted if not provided)    |              |
| `--remove`              | Remove the specified tag instead of adding   |              |

## Examples

### Add a tag

```bash
envault tag API_KEY production
```

### Add a tag with explicit vault and password

```bash
envault tag DB_URL staging -v ./team.envault -p mypassword
```

### Remove a tag

```bash
envault tag API_KEY production --remove
```

## Notes

- Tags are stored as an array on each vault entry.
- Duplicate tags on the same key are not allowed.
- Use `envault search` with tag filtering to query entries by tag.
- Tags are preserved through `rotate` and `merge` operations.
