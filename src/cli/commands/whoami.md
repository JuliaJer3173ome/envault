# whoami

The `whoami` command lets you manage your local envault identity. This identity is stored in `~/.envault/identity.json` and is used to tag audit history entries with the author's name and email.

## Usage

```bash
# Show current identity
envault whoami

# Set name and email
envault whoami --set-name "Alice" --set-email "alice@example.com"

# Update just the name
envault whoami --set-name "Alice B."

# Clear stored identity
envault whoami --clear
```

## Options

| Option | Description |
|---|---|
| `--set-name <name>` | Set your display name |
| `--set-email <email>` | Set your email address |
| `--clear` | Remove stored identity |

## Notes

- Identity is stored locally and never encrypted or uploaded.
- Used by `audit` and `history` commands to annotate changes.
- If no identity is set, those commands will show `unknown` as the author.
