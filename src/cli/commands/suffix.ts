import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

/**
 * Appends a suffix to all keys (or filtered keys) in a vault.
 */
export function suffixEntries(
  entries: Record<string, string>,
  suffix: string,
  filter?: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (filter && !key.includes(filter)) {
      result[key] = value;
    } else {
      result[`${key}${suffix}`] = value;
    }
  }
  return result;
}

export function registerSuffixCommand(program: Command): void {
  program
    .command('suffix <vault> <suffix>')
    .description('Append a suffix to all keys in a vault')
    .option('-p, --password <password>', 'Vault password')
    .option('-f, --filter <substring>', 'Only rename keys containing this substring')
    .option('--dry-run', 'Preview changes without saving')
    .action(async (vaultPath: string, suffix: string, options) => {
      try {
        const password = options.password;
        if (!password) {
          console.error('Error: password is required (--password)');
          process.exit(1);
        }

        if (!suffix) {
          console.error('Error: suffix cannot be empty');
          process.exit(1);
        }

        const vault = await openVault(vaultPath, password);
        const original = vault.entries as Record<string, string>;
        const updated = suffixEntries(original, suffix, options.filter);

        const added: string[] = [];
        const removed: string[] = [];

        for (const key of Object.keys(original)) {
          const newKey = options.filter && !key.includes(options.filter)
            ? key
            : `${key}${suffix}`;
          if (newKey !== key) {
            removed.push(key);
            added.push(newKey);
          }
        }

        if (added.length === 0) {
          console.log('No keys matched. Nothing to rename.');
          return;
        }

        if (options.dryRun) {
          console.log('Dry run — no changes saved:\n');
          for (let i = 0; i < added.length; i++) {
            console.log(`  ${removed[i]}  →  ${added[i]}`);
          }
          return;
        }

        vault.entries = updated;
        await writeVault(vaultPath, vault, password);

        console.log(`Renamed ${added.length} key(s) with suffix "${suffix}":`);
        for (let i = 0; i < added.length; i++) {
          console.log(`  ${removed[i]}  →  ${added[i]}`);
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
