import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function omitEntries(
  entries: Record<string, string>,
  keys: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (!keys.includes(k)) {
      result[k] = v;
    }
  }
  return result;
}

export function registerOmitCommand(program: Command): void {
  program
    .command('omit <vault> <keys...>')
    .description('Remove specific keys from a vault, writing the result back')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'print result without saving')
    .action(async (vaultPath: string, keys: string[], opts) => {
      try {
        const password = opts.password ?? process.env.ENVAULT_PASSWORD;
        if (!password) {
          console.error('Error: password is required (--password or ENVAULT_PASSWORD)');
          process.exit(1);
        }

        const vault = await openVault(vaultPath, password);
        const before = Object.keys(vault.entries).length;
        const updated = omitEntries(vault.entries, keys);
        const removed = before - Object.keys(updated).length;

        if (opts.dryRun) {
          console.log(JSON.stringify(updated, null, 2));
          console.log(`\nDry run: would remove ${removed} key(s).`);
          return;
        }

        vault.entries = updated;
        await writeVault(vaultPath, vault, password);
        console.log(`Removed ${removed} key(s) from ${vaultPath}.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
