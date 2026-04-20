import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

export function sliceEntries(
  entries: Record<string, string>,
  start: number,
  end?: number
): Record<string, string> {
  const keys = Object.keys(entries);
  const sliced = keys.slice(start, end);
  const result: Record<string, string> = {};
  for (const key of sliced) {
    result[key] = entries[key];
  }
  return result;
}

export function registerSliceCommand(program: Command): void {
  program
    .command('slice <vault> <start> [end]')
    .description('Extract a slice of entries by index range')
    .option('-p, --password <password>', 'vault password')
    .option('--in-place', 'overwrite the vault with sliced entries')
    .action(async (vaultPath: string, startStr: string, endStr: string | undefined, opts) => {
      const password = opts.password ?? await promptPassword('Password: ');
      const start = parseInt(startStr, 10);
      const end = endStr !== undefined ? parseInt(endStr, 10) : undefined;

      if (isNaN(start) || (end !== undefined && isNaN(end))) {
        console.error('Invalid index values');
        process.exit(1);
      }

      const vault = await openVault(vaultPath, password);
      const sliced = sliceEntries(vault.entries, start, end);

      if (opts.inPlace) {
        vault.entries = sliced;
        await writeVault(vaultPath, vault, password);
        console.log(`Vault sliced to ${Object.keys(sliced).length} entries.`);
      } else {
        for (const [key, value] of Object.entries(sliced)) {
          console.log(`${key}=${value}`);
        }
      }
    });
}
