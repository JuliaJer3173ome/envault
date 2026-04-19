import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function sortEntries(
  entries: Record<string, string>,
  order: 'asc' | 'desc' = 'asc'
): Record<string, string> {
  const keys = Object.keys(entries).sort();
  if (order === 'desc') keys.reverse();
  const sorted: Record<string, string> = {};
  for (const key of keys) sorted[key] = entries[key];
  return sorted;
}

export function registerSortCommand(program: Command): void {
  program
    .command('sort <vault>')
    .description('Sort vault entries alphabetically by key')
    .option('-p, --password <password>', 'vault password')
    .option('-d, --desc', 'sort in descending order')
    .option('--dry-run', 'print sorted keys without saving')
    .action(async (vaultPath: string, opts) => {
      try {
        const password = opts.password ?? '';
        const vault = await openVault(vaultPath, password);
        const order = opts.desc ? 'desc' : 'asc';
        const sorted = sortEntries(vault.entries, order);

        if (opts.dryRun) {
          console.log(Object.keys(sorted).join('\n'));
          return;
        }

        vault.entries = sorted;
        await writeVault(vaultPath, vault);
        console.log(`Sorted ${Object.keys(sorted).length} entries (${order}).`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
