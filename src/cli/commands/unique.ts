import { Command } from 'commander';
import { openVault } from '../../crypto';

export function findDuplicateValues(entries: Record<string, string>): Record<string, string[]> {
  const valueMap: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (!valueMap[value]) valueMap[value] = [];
    valueMap[value].push(key);
  }
  return Object.fromEntries(
    Object.entries(valueMap).filter(([, keys]) => keys.length > 1)
  );
}

export function filterUniqueEntries(entries: Record<string, string>): Record<string, string> {
  const seen = new Set<string>();
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (!seen.has(value)) {
      seen.add(value);
      result[key] = value;
    }
  }
  return result;
}

export function registerUniqueCommand(program: Command): void {
  program
    .command('unique <vault>')
    .description('Show or filter entries with unique values')
    .option('-p, --password <password>', 'vault password')
    .option('--duplicates', 'show only duplicate values')
    .action(async (vaultPath: string, opts) => {
      const password = opts.password ?? '';
      try {
        const vault = await openVault(vaultPath, password);
        const entries = vault.entries as Record<string, string>;
        if (opts.duplicates) {
          const dupes = findDuplicateValues(entries);
          if (Object.keys(dupes).length === 0) {
            console.log('No duplicate values found.');
          } else {
            for (const [value, keys] of Object.entries(dupes)) {
              console.log(`Value "${value}" shared by: ${keys.join(', ')}`);
            }
          }
        } else {
          const unique = filterUniqueEntries(entries);
          for (const [key, value] of Object.entries(unique)) {
            console.log(`${key}=${value}`);
          }
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
