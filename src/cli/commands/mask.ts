import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function maskEntries(
  entries: Record<string, string>,
  keys: string[]
): Record<string, string> {
  const result: Record<string, string> = { ...entries };
  for (const key of keys) {
    if (key in result) {
      const val = result[key];
      result[key] = val.length <= 4 ? '****' : val.slice(0, 2) + '*'.repeat(val.length - 4) + val.slice(-2);
    }
  }
  return result;
}

export function registerMaskCommand(program: Command): void {
  program
    .command('mask <vault> <keys...>')
    .description('Display vault entries with specified keys masked')
    .option('-p, --password <password>', 'vault password')
    .option('--write', 'persist masked values to vault')
    .action(async (vaultPath: string, keys: string[], opts) => {
      try {
        const password = opts.password ?? '';
        const vault = await openVault(vaultPath, password);
        const masked = maskEntries(vault.entries, keys);

        if (opts.write) {
          vault.entries = masked;
          await writeVault(vaultPath, vault);
          console.log('Masked values written to vault.');
        } else {
          for (const [k, v] of Object.entries(masked)) {
            console.log(`${k}=${v}`);
          }
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
