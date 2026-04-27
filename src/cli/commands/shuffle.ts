import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import { promptPassword } from './init';

export function shuffleEntries(entries: Record<string, string>): Record<string, string> {
  const keys = Object.keys(entries);
  // Fisher-Yates shuffle on keys
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  const shuffled: Record<string, string> = {};
  for (const key of keys) {
    shuffled[key] = entries[key];
  }
  return shuffled;
}

export function registerShuffleCommand(program: Command): void {
  program
    .command('shuffle <vault>')
    .description('Randomly shuffle the order of entries in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('--seed <seed>', 'optional seed label for reproducibility (no-op, documents intent)')
    .option('--dry-run', 'print shuffled keys without saving')
    .action(async (vaultPath: string, options: { password?: string; dryRun?: boolean }) => {
      try {
        const password = options.password ?? (await promptPassword('Enter vault password: '));
        const vault = await openVault(vaultPath, password);
        const shuffled = shuffleEntries(vault.entries);

        if (options.dryRun) {
          console.log('Shuffled key order (dry-run):');
          Object.keys(shuffled).forEach((key, idx) => {
            console.log(`  ${idx + 1}. ${key}`);
          });
          return;
        }

        vault.entries = shuffled;
        await writeVault(vaultPath, vault, password);
        console.log(`Shuffled ${Object.keys(shuffled).length} entries in vault: ${vaultPath}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
