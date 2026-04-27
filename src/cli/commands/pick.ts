import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import { promptPassword } from './init';

export function pickEntries(
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

export function registerPickCommand(program: Command): void {
  program
    .command('pick <vault> <keys...>')
    .description('Keep only the specified keys in the vault, removing all others')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'preview changes without writing')
    .action(async (vaultPath: string, keys: string[], options) => {
      try {
        const password = options.password ?? (await promptPassword('Enter vault password: '));
        const vault = await openVault(vaultPath, password);

        const picked = pickEntries(vault.entries, keys);
        const missing = keys.filter(
          (k) => !Object.prototype.hasOwnProperty.call(vault.entries, k)
        );

        if (missing.length > 0) {
          console.warn(`Warning: keys not found in vault: ${missing.join(', ')}`);
        }

        if (options.dryRun) {
          console.log('Keys that would be kept:');
          Object.keys(picked).forEach((k) => console.log(`  ${k}`));
          const removed = Object.keys(vault.entries).filter((k) => !keys.includes(k));
          if (removed.length > 0) {
            console.log('Keys that would be removed:');
            removed.forEach((k) => console.log(`  ${k}`));
          }
          return;
        }

        vault.entries = picked;
        await writeVault(vaultPath, vault, password);
        console.log(`Kept ${Object.keys(picked).length} key(s) in vault.`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
