# `copy` and `move` Commands

These commands allow you to duplicate or relocate environment variable keys within an encrypted vault.

## `copy <source> <destination>`

Copies the value of an existing key to a new key, leaving the original intact.

```bash
envault copy DB_HOST DB_HOST_BACKUP -p mypassword
```

**Options:**

| Option | Description | Default |
|---|---|---|
| `-f, --file <path>` | Path to vault file | `.envault` |
| `-p, --password <password>` | Vault password (prompted if omitted) | — |

**Errors:**
- Exits with code `1` if the source key does not exist.
- Exits with code `1` if the destination key already exists (use `set` to overwrite).

---

## `move <source> <destination>`

Moves a key to a new name, removing the original key from the vault.

```bash
envault move OLD_API_KEY NEW_API_KEY -p mypassword
```

**Options:**

| Option | Description | Default |
|---|---|---|
| `-f, --file <path>` | Path to vault file | `.envault` |
| `-p, --password <password>` | Vault password (prompted if omitted) | — |

**Errors:**
- Exits with code `1` if the source key does not exist.
- Exits with code `1` if the destination key already exists (use `rename` to overwrite).

---

> Both commands require the correct vault password and will fail gracefully on decryption errors.
