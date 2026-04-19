import { Command } from 'commander';
import { openVault } from '../../crypto/vault';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function headEntries(entries: Record<string, string>, n: number): Record<string, string> {
  const keys = Object.keys(entries).slice(0, n);
  return Object.fromEntries(keys.map((k) => [k, entries[k]]));
}

export function registerHeadCommand(program: Command): void {
  program
    .command('head <vault>')
    .description('Show the first N entries of a vault')
    .option('-n, --count <number>', 'Number of entries to show', '10')
    .option('-p, --password <password>', 'Vault password')
    .option('--keys-only', 'Show only keys, not values')
    .action(async (vaultPath: string, opts) => {
      try {
        const password = opts.password ?? (await promptPassword('Password: '));
        const vault = await openVault(vaultPath, password);
        const count = parseInt(opts.count, 10);
        if (isNaN(count) || count < 1) {
          console.error('Error: count must be a positive integer');
          process.exit(1);
        }
        const slice = headEntries(vault.entries, count);
        const keys = Object.keys(slice);
        if (keys.length === 0) {
          console.log('(no entries)');
          return;
        }
        for (const key of keys) {
          if (opts.keysOnly) {
            console.log(key);
          } else {
            console.log(`${key}=${slice[key]}`);
          }
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
