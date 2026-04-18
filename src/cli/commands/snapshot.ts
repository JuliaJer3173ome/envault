import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { openVault } from '../../crypto';
import { promptPassword } from './init';

export function getSnapshotDir(vaultPath: string): string {
  const base = path.basename(vaultPath, '.vault');
  return path.join(path.dirname(vaultPath), `.${base}-snapshots`);
}

export function listSnapshots(vaultPath: string): string[] {
  const dir = getSnapshotDir(vaultPath);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.vault')).sort();
}

export function saveSnapshot(vaultPath: string, label?: string): string {
  const dir = getSnapshotDir(vaultPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const name = label ? `${ts}-${label}.vault` : `${ts}.vault`;
  const dest = path.join(dir, name);
  fs.copyFileSync(vaultPath, dest);
  return dest;
}

export function restoreSnapshot(vaultPath: string, snapshotName: string): void {
  const dir = getSnapshotDir(vaultPath);
  const src = path.join(dir, snapshotName);
  if (!fs.existsSync(src)) throw new Error(`Snapshot not found: ${snapshotName}`);
  fs.copyFileSync(src, vaultPath);
}

export function registerSnapshotCommand(program: Command): void {
  const snap = program.command('snapshot').description('Manage vault snapshots');

  snap
    .command('save <vault>')
    .option('-l, --label <label>', 'optional snapshot label')
    .description('Save a snapshot of the vault')
    .action(async (vault, opts) => {
      const password = await promptPassword();
      await openVault(vault, password);
      const dest = saveSnapshot(vault, opts.label);
      console.log(`Snapshot saved: ${path.basename(dest)}`);
    });

  snap
    .command('list <vault>')
    .description('List available snapshots')
    .action((vault) => {
      const snaps = listSnapshots(vault);
      if (snaps.length === 0) return console.log('No snapshots found.');
      snaps.forEach(s => console.log(s));
    });

  snap
    .command('restore <vault> <snapshot>')
    .description('Restore a vault from a snapshot')
    .action(async (vault, snapshot) => {
      const password = await promptPassword();
      await openVault(vault, password);
      restoreSnapshot(vault, snapshot);
      console.log(`Vault restored from snapshot: ${snapshot}`);
    });
}
