import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function reverseEntries(entries: Record<string, string>): Record<string, string> {
  const keys = Object.keys(entries);
  const reversed: Record<string, string> = {};
  for (const key of keys.reverse()) {
    reversed[key] = entries[key];
  }
  return reversed;
}

export function registerReverseCommand(program: Command): void {
  program
    .command('reverse <vault>')
    .description('Reverse the order of entries in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'print reversed entries without saving')
    .action(async (vaultPath: string, options: { password?: string; dryRun?: boolean }) => {
      try {
        const password = options.password ?? '';
        const vault = await openVault(vaultPath, password);
        const reversed = reverseEntries(vault.entries);

        if (options.dryRun) {
          for (const [key, value] of Object.entries(reversed)) {
            console.log(`${key}=${value}`);
          }
          return;
        }

        vault.entries = reversed;
        await writeVault(vaultPath, vault, password);
        console.log(`Reversed ${Object.keys(reversed).length} entries in ${vaultPath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
