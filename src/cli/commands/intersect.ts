import { Command } from 'commander';
import { openVault } from '../../crypto/vault';

export function intersectEntries(
  aEntries: Record<string, string>,
  bEntries: Record<string, string>,
  valuesMatch: boolean = false
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(aEntries)) {
    if (key in bEntries) {
      if (!valuesMatch || aEntries[key] === bEntries[key]) {
        result[key] = aEntries[key];
      }
    }
  }
  return result;
}

export function registerIntersectCommand(program: Command): void {
  program
    .command('intersect <vaultA> <vaultB>')
    .description('Show keys (and values) common to two vaults')
    .option('-p, --password <password>', 'vault password')
    .option('-v, --values', 'only include keys where values also match', false)
    .option('--json', 'output as JSON', false)
    .action(async (vaultA: string, vaultB: string, opts) => {
      try {
        const password = opts.password ?? '';
        const entriesA = await openVault(vaultA, password);
        const entriesB = await openVault(vaultB, password);
        const result = intersectEntries(entriesA, entriesB, opts.values);
        const keys = Object.keys(result);

        if (keys.length === 0) {
          console.log('No common keys found.');
          return;
        }

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          for (const key of keys) {
            console.log(`${key}=${result[key]}`);
          }
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
