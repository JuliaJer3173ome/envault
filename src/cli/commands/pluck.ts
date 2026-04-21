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

export function pluckEntries(
  entries: Record<string, string>,
  keys: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(entries, key)) {
      result[key] = entries[key];
    }
  }
  return result;
}

export function registerPluckCommand(program: Command): void {
  program
    .command('pluck <vault> <keys...>')
    .description('Extract only the specified keys from a vault and print them')
    .option('-p, --password <password>', 'vault password')
    .option('--json', 'output as JSON')
    .action(async (vaultPath: string, keys: string[], options) => {
      try {
        const password =
          options.password ?? (await promptPassword('Enter vault password: '));
        const vault = await openVault(vaultPath, password);
        const plucked = pluckEntries(vault.entries, keys);

        const missing = keys.filter(
          (k) => !Object.prototype.hasOwnProperty.call(plucked, k)
        );
        if (missing.length > 0) {
          process.stderr.write(`Warning: keys not found: ${missing.join(', ')}\n`);
        }

        if (options.json) {
          process.stdout.write(JSON.stringify(plucked, null, 2) + '\n');
        } else {
          for (const [key, value] of Object.entries(plucked)) {
            process.stdout.write(`${key}=${value}\n`);
          }
        }
      } catch (err: any) {
        process.stderr.write(`Error: ${err.message}\n`);
        process.exit(1);
      }
    });
}
