import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function getBackupPath(vaultPath: string, label?: string): string {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, '.vault');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const suffix = label ? `${label}-${timestamp}` : timestamp;
  return path.join(dir, `${base}.backup-${suffix}.vault`);
}

/**
 * Lists all backup files associated with a given vault path.
 * Backups are identified by the `.backup-` infix in the filename.
 */
export function listBackups(vaultPath: string): string[] {
  const dir = path.dirname(vaultPath);
  const base = path.basename(vaultPath, '.vault');
  const prefix = `${base}.backup-`;
  return fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.vault'))
    .map((f) => path.join(dir, f))
    .sort();
}

export function registerBackupCommand(program: Command): void {
  program
    .command('backup <vault>')
    .description('Create a timestamped backup copy of a vault')
    .option('-l, --label <label>', 'Optional label for the backup file')
    .option('-o, --output <path>', 'Custom output path for the backup')
    .action(async (vaultPath: string, options: { label?: string; output?: string }) => {
      try {
        if (!fs.existsSync(vaultPath)) {
          console.error(`Vault not found: ${vaultPath}`);
          process.exit(1);
        }

        const backupPath = options.output ?? getBackupPath(vaultPath, options.label);

        if (fs.existsSync(backupPath)) {
          console.error(`Backup already exists at: ${backupPath}`);
          process.exit(1);
        }

        fs.copyFileSync(vaultPath, backupPath);
        console.log(`Backup created: ${backupPath}`);
      } catch (err: any) {
        console.error(`Backup failed: ${err.message}`);
        process.exit(1);
      }
    });
}
