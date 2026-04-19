import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function prefixEntries(
  entries: Record<string, string>,
  prefix: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    result[`${prefix}${key}`] = value;
  }
  return result;
}

export function registerPrefixCommand(program: Command): void {
  program
    .command('prefix <vault> <prefix>')
    .description('Add a prefix to all keys in the vault')
    .option('-p, --password <password>', 'vault password')
    .option('--strip', 'strip the prefix instead of adding it')
    .action(async (vaultPath: string, prefix: string, opts) => {
      try {
        const password = opts.password;
        if (!password) {
          console.error('Password is required (--password)');
          process.exit(1);
        }

        const vault = await openVault(vaultPath, password);
        const entries = vault.entries as Record<string, string>;

        let updated: Record<string, string>;
        if (opts.strip) {
          updated = {};
          for (const [key, value] of Object.entries(entries)) {
            const newKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
            updated[newKey] = value;
          }
        } else {
          updated = prefixEntries(entries, prefix);
        }

        await writeVault(vaultPath, { ...vault, entries: updated }, password);
        const action = opts.strip ? 'Stripped' : 'Added';
        console.log(`${action} prefix "${prefix}" on ${Object.keys(updated).length} key(s).`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
