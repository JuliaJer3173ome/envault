import { Command } from 'commander';
import { openVault } from '../../crypto/vault';
import * as fs from 'fs';

export function grepEntries(
  entries: Record<string, string>,
  pattern: string,
  searchValues: boolean
): Array<{ key: string; value: string }> {
  const regex = new RegExp(pattern, 'i');
  return Object.entries(entries)
    .filter(([key, value]) => regex.test(key) || (searchValues && regex.test(value)))
    .map(([key, value]) => ({ key, value }));
}

export function registerGrepCommand(program: Command): void {
  program
    .command('grep <pattern> <vault>')
    .description('Search vault entries by key or value using a regex pattern')
    .option('-p, --password <password>', 'vault password')
    .option('-v, --values', 'also search in values', false)
    .option('--keys-only', 'print only matching keys', false)
    .action(async (pattern: string, vaultPath: string, opts) => {
      try {
        if (!fs.existsSync(vaultPath)) {
          console.error(`Vault not found: ${vaultPath}`);
          process.exit(1);
        }
        const password = opts.password;
        if (!password) {
          console.error('Password is required (--password)');
          process.exit(1);
        }
        const entries = await openVault(vaultPath, password);
        const matches = grepEntries(entries, pattern, opts.values);
        if (matches.length === 0) {
          console.log('No matches found.');
          return;
        }
        for (const { key, value } of matches) {
          if (opts.keysOnly) {
            console.log(key);
          } else {
            console.log(`${key}=${value}`);
          }
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
