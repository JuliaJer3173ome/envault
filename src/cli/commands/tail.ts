import { Command } from 'commander';
import { openVault } from '../../crypto';
import * as fs from 'fs';
import * as readline from 'readline';

export function promptPassword(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Password: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function tailEntries(
  entries: Record<string, string>,
  n: number
): Record<string, string> {
  const keys = Object.keys(entries);
  const tail = keys.slice(Math.max(0, keys.length - n));
  return Object.fromEntries(tail.map((k) => [k, entries[k]]));
}

export function registerTailCommand(program: Command): void {
  program
    .command('tail <vault>')
    .description('Show the last N entries of a vault')
    .option('-n, --lines <number>', 'Number of entries to show', '10')
    .option('-p, --password <password>', 'Vault password')
    .action(async (vaultPath: string, opts) => {
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }
      const password = opts.password ?? (await promptPassword());
      const n = parseInt(opts.lines, 10);
      if (isNaN(n) || n <= 0) {
        console.error('Invalid number of lines');
        process.exit(1);
      }
      try {
        const vault = await openVault(vaultPath, password);
        const result = tailEntries(vault.entries, n);
        for (const [key, value] of Object.entries(result)) {
          console.log(`${key}=${value}`);
        }
      } catch {
        console.error('Failed to open vault. Wrong password?');
        process.exit(1);
      }
    });
}
