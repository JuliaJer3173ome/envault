import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault } from '../../crypto';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function listKeys(entries: Record<string, string>): string[] {
  return Object.keys(entries).sort();
}

export function filterKeys(keys: string[], pattern: string): string[] {
  const regex = new RegExp(pattern, 'i');
  return keys.filter((k) => regex.test(k));
}

export function registerKeysCommand(program: Command): void {
  program
    .command('keys <vault>')
    .description('List all keys in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('-f, --filter <pattern>', 'filter keys by regex pattern')
    .option('--count', 'show count only')
    .action(async (vaultPath: string, options) => {
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }
      const password = options.password ?? (await promptPassword('Password: '));
      try {
        const vault = await openVault(vaultPath, password);
        let keys = listKeys(vault.entries);
        if (options.filter) {
          keys = filterKeys(keys, options.filter);
        }
        if (options.count) {
          console.log(keys.length);
        } else {
          keys.forEach((k) => console.log(k));
        }
      } catch {
        console.error('Failed to open vault. Wrong password?');
        process.exit(1);
      }
    });
}
