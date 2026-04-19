import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function uppercaseEntries(
  entries: Record<string, string>,
  keys?: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (!keys || keys.includes(k)) {
      result[k] = v.toUpperCase();
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function registerUppercaseCommand(program: Command): void {
  program
    .command('uppercase <vault>')
    .description('Convert values in the vault to uppercase')
    .option('-p, --password <password>', 'vault password')
    .option('-k, --keys <keys>', 'comma-separated list of keys to uppercase')
    .action(async (vaultPath: string, opts) => {
      try {
        const password = opts.password;
        if (!password) {
          console.error('Password is required (--password)');
          process.exit(1);
        }
        const keys = opts.keys
          ? (opts.keys as string).split(',').map((k: string) => k.trim())
          : undefined;
        const vault = await openVault(vaultPath, password);
        const updated = uppercaseEntries(vault.entries, keys);
        vault.entries = updated;
        await writeVault(vaultPath, vault);
        console.log('Values uppercased successfully.');
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
