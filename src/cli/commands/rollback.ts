import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function getRollbackDir(vaultPath: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, path.extname(vaultPath));
  return path.join(dir, `.${base}.rollback`);
}

export function listRollbacks(vaultPath: string): string[] {
  const dir = getRollbackDir(vaultPath);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.vault'))
    .sort()
    .reverse();
}

export function saveRollback(vaultPath: string, data: Buffer): void {
  const dir = getRollbackDir(vaultPath);
  fs.mkdirSync(dir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(dir, `${timestamp}.vault`);
  fs.writeFileSync(dest, data);
}

export function registerRollbackCommand(program: Command): void {
  const cmd = program.command('rollback');

  cmd
    .command('list <vault>')
    .description('List available rollback points for a vault')
    .action((vault: string) => {
      const points = listRollbacks(vault);
      if (points.length === 0) {
        console.log('No rollback points found.');
      } else {
        points.forEach((p, i) => console.log(`[${i}] ${p}`));
      }
    });

  cmd
    .command('restore <vault> [index]')
    .description('Restore a vault to a previous rollback point (default: most recent)')
    .option('-p, --password <password>', 'vault password')
    .action(async (vault: string, index: string | undefined, opts: { password?: string }) => {
      const points = listRollbacks(vault);
      if (points.length === 0) {
        console.error('No rollback points available.');
        process.exit(1);
      }
      const idx = index !== undefined ? parseInt(index, 10) : 0;
      if (isNaN(idx) || idx < 0 || idx >= points.length) {
        console.error(`Invalid index. Choose between 0 and ${points.length - 1}.`);
        process.exit(1);
      }
      const dir = getRollbackDir(vault);
      const src = path.join(dir, points[idx]);
      const data = fs.readFileSync(src);
      // Save current state before restoring
      if (fs.existsSync(vault)) {
        saveRollback(vault, fs.readFileSync(vault));
      }
      fs.writeFileSync(vault, data);
      console.log(`Restored vault from rollback point: ${points[idx]}`);
    });
}
