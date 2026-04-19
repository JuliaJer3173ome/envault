import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault } from '../../crypto';

async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function catEntries(
  entries: Record<string, string>,
  keys: string[]
): string {
  const selected = keys.length > 0 ? keys : Object.keys(entries);
  return selected
    .filter((k) => k in entries)
    .map((k) => `${k}=${entries[k]}`)
    .join('\n');
}

export function registerCatCommand(program: Command): void {
  program
    .command('cat <vault>')
    .description('Print one or more entries from a vault in KEY=VALUE format')
    .option('-p, --password <password>', 'vault password')
    .option('-k, --keys <keys>', 'comma-separated list of keys to print')
    .action(async (vaultPath: string, opts) => {
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }
      const password = opts.password ?? (await promptPassword('Password: '));
      try {
        const vault = await openVault(vaultPath, password);
        const keys: string[] = opts.keys
          ? opts.keys.split(',').map((k: string) => k.trim())
          : [];
        const output = catEntries(vault.entries, keys);
        if (output) console.log(output);
      } catch {
        console.error('Failed to open vault. Wrong password?');
        process.exit(1);
      }
    });
}
