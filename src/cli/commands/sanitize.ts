import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function sanitizeEntries(entries: Record<string, string>): {
  sanitized: Record<string, string>;
  removed: string[];
} {
  const sanitized: Record<string, string> = {};
  const removed: string[] = [];

  for (const [key, value] of Object.entries(entries)) {
    const trimmedValue = value.trim();
    if (trimmedValue === '' || trimmedValue === 'null' || trimmedValue === 'undefined') {
      removed.push(key);
    } else {
      sanitized[key] = trimmedValue;
    }
  }

  return { sanitized, removed };
}

export function registerSanitizeCommand(program: Command): void {
  program
    .command('sanitize <vault>')
    .description('Remove empty, null, or undefined values from a vault')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'preview changes without applying them')
    .action(async (vaultPath: string, opts) => {
      try {
        const password = opts.password ?? '';
        const vault = await openVault(vaultPath, password);
        const { sanitized, removed } = sanitizeEntries(vault.entries);

        if (removed.length === 0) {
          console.log('No entries to sanitize.');
          return;
        }

        console.log(`Entries to remove (${removed.length}):`);
        for (const key of removed) {
          console.log(`  - ${key}`);
        }

        if (!opts.dryRun) {
          await writeVault(vaultPath, { ...vault, entries: sanitized });
          console.log('Vault sanitized successfully.');
        } else {
          console.log('Dry run — no changes applied.');
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
