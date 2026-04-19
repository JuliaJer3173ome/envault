import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function redactEntries(
  entries: Record<string, string>,
  keys: string[]
): Record<string, string> {
  const result = { ...entries };
  for (const key of keys) {
    if (key in result) {
      result[key] = '***REDACTED***';
    }
  }
  return result;
}

export function registerRedactCommand(program: Command): void {
  program
    .command('redact <vault> <keys...>')
    .description('Redact specific keys in a vault by replacing their values')
    .option('-p, --password <password>', 'vault password')
    .option('--permanent', 'permanently remove the key instead of masking it')
    .action(async (vaultPath: string, keys: string[], opts) => {
      try {
        const password = opts.password ?? '';
        const vault = await openVault(vaultPath, password);
        const entries: Record<string, string> = vault.entries ?? {};

        const missing = keys.filter((k) => !(k in entries));
        if (missing.length > 0) {
          console.warn(`Warning: keys not found: ${missing.join(', ')}`);
        }

        let updated: Record<string, string>;
        if (opts.permanent) {
          updated = { ...entries };
          for (const key of keys) delete updated[key];
        } else {
          updated = redactEntries(entries, keys);
        }

        await writeVault(vaultPath, password, { ...vault, entries: updated });
        const action = opts.permanent ? 'removed' : 'redacted';
        console.log(`Successfully ${action} ${keys.length} key(s) in ${vaultPath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
