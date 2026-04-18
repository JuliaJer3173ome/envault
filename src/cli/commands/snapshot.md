# `snapshot` Command

The `snapshot` command lets you save, list, and restore point-in-time copies of a vault file. Snapshots are stored in a hidden sibling directory next to the vault.

## Usage

```bash
envault snapshot save <vault> [--label <label>]
envault snapshot list <vault>
envault snapshot restore <vault> <snapshot>
```

## Subcommands

### `save`

Saves the current state of the vault as a timestamped snapshot.

```bash
envault snapshot save secrets.vault
envault snapshot save secrets.vault --label before-deploy
```

Snapshots are stored in `.secrets-snapshots/` next to the vault file.

### `list`

Lists all available snapshots for a vault.

```bash
envault snapshot list secrets.vault
```

### `restore`

Restores the vault to the state captured in a given snapshot. The password is verified before restoring.

```bash
envault snapshot restore secrets.vault 2024-06-01T12-00-00-000Z-before-deploy.vault
```

## Notes

- Snapshots are raw vault file copies and remain encrypted.
- Use `--label` to make snapshots easier to identify.
- Combine with `backup` for off-site copies.
