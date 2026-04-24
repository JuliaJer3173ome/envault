import { Command } from 'commander';
import { openVault, updateVault } from '../../crypto/vault';
import * as fs from 'fs';

export function renameValue(
  entries: Record<string, string>,
  oldValue: string,
  newValue: string
): { updated: Record<string, string>; count: number } {
  let count = 0;
  const updated: Record<string, string> = {};
  for (const [key, val] of Object.entries(entries)) {
    if (val === oldValue) {
      updated[key] = newValue;
      count++;
    } else {
      updated[key] = val;
    }
  }
  return { updated, count };
}

export function registerRenameValueCommand(program: Command): void {
  program
    .command('rename-value <vault> <oldValue> <newValue>')
    .description('Replace all occurrences of a value across all keys in the vault')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'preview changes without writing')
    .action(async (vaultPath: string, oldValue: string, newValue: string, opts) => {
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }

      const password = opts.password;
      if (!password) {
        console.error('Password is required (--password)');
        process.exit(1);
      }

      try {
        const entries = await openVault(vaultPath, password);
        const { updated, count } = renameValue(entries, oldValue, newValue);

        if (count === 0) {
          console.log(`No entries found with value: ${oldValue}`);
          return;
        }

        if (opts.dryRun) {
          console.log(`[dry-run] Would update ${count} key(s) from "${oldValue}" to "${newValue}"`);
          const changed = Object.entries(updated).filter(([k]) => entries[k] !== updated[k]);
          for (const [key] of changed) {
            console.log(`  ${key}: "${oldValue}" → "${newValue}"`);
          }
          return;
        }

        await updateVault(vaultPath, password, updated);
        console.log(`Updated ${count} key(s): "${oldValue}" → "${newValue}"`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
