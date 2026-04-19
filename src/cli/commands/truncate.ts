import { Command } from 'commander';
import * as readline from 'readline';
import { openVault, writeVault } from '../../crypto/vault';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function truncateEntries(
  entries: Record<string, string>,
  keys: string[]
): Record<string, string> {
  const result = { ...entries };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Returns keys that exist in entries and keys that do not.
 */
export function partitionKeys(
  entries: Record<string, string>,
  keys: string[]
): { found: string[]; missing: string[] } {
  const found = keys.filter((k) => k in entries);
  const missing = keys.filter((k) => !(k in entries));
  return { found, missing };
}

export function registerTruncateCommand(program: Command): void {
  program
    .command('truncate <vault> <keys...>')
    .description('Remove multiple keys from a vault at once')
    .option('-p, --password <password>', 'vault password')
    .option('-y, --yes', 'skip confirmation prompt')
    .action(async (vaultPath: string, keys: string[], opts) => {
      try {
        const password = opts.password ?? (await promptPassword('Password: '));
        const vault = await openVault(vaultPath, password);
        const { found: toRemove, missing } = partitionKeys(vault.entries, keys);
        if (missing.length > 0) {
          console.warn(`Warning: keys not found: ${missing.join(', ')}`);
        }
        if (toRemove.length === 0) {
          console.log('No matching keys to remove.');
          return;
        }
        if (!opts.yes) {
          const confirm = await promptPassword(
            `Remove ${toRemove.length} key(s) [${toRemove.join(', ')}]? (y/N): `
          );
          if (confirm.toLowerCase() !== 'y') {
            console.log('Aborted.');
            return;
          }
        }
        vault.entries = truncateEntries(vault.entries, toRemove);
        await writeVault(vaultPath, vault);
        console.log(`Removed ${toRemove.length} key(s) from ${vaultPath}.`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
