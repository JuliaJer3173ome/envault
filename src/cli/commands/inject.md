# inject

Run a shell command with secrets from a vault injected as environment variables.

## Usage

```bash
envault inject <vault> [options] -- <command> [args...]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Path to the vault file |
| `cmd`    | Command and arguments to execute |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Vault password (prompted if omitted) |
| `--prefix <prefix>` | Only inject keys that start with the given prefix |
| `--strip-prefix` | Remove the prefix from key names before injecting |

## Examples

```bash
# Inject all secrets and run a node script
envault inject .vault.enc node server.js

# Inject only keys prefixed with APP_
envault inject .vault.enc --prefix APP_ npm start

# Inject APP_ keys but strip the prefix (APP_TOKEN becomes TOKEN)
envault inject .vault.enc --prefix APP_ --strip-prefix node app.js
```

## Notes

- The child process inherits all current environment variables in addition to the injected secrets.
- Vault secrets override any existing environment variables with the same name.
- Use `--strip-prefix` together with `--prefix` to namespace secrets in the vault while keeping clean names in the process.
