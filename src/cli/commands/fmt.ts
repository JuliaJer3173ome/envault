import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault, writeVault } from '../../crypto/vault';

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function formatEntries(entries: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(entries).sort()) {
    sorted[key] = entries[key].trim();
  }
  return sorted;
}

export function registerFmtCommand(program: Command): void {
  program
    .command('fmt <vault>')
    .description('Sort and normalize all keys in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'preview changes without writing')
    .action(async (vaultPath: string, options: { password?: string; dryRun?: boolean }) => {
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }
      const password = options.password ?? await promptPassword('Password: ');
      let vault;
      try {
        vault = await openVault(vaultPath, password);
      } catch {
        console.error('Failed to open vault. Wrong password?');
        process.exit(1);
      }
      const original = Object.keys(vault.entries);
      const formatted = formatEntries(vault.entries);
      const sorted = Object.keys(formatted);
      const changed = JSON.stringify(original) !== JSON.stringify(sorted);
      if (!changed) {
        console.log('Vault is already formatted.');
        return;
      }
      if (options.dryRun) {
        console.log('Would reorder keys:');
        sorted.forEach((k) => console.log(`  ${k}`));
        return;
      }
      vault.entries = formatted;
      await writeVault(vaultPath, vault);
      console.log(`Formatted vault: ${sorted.length} keys sorted.`);
    });
}
