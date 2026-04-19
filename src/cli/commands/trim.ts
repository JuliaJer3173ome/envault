import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';

export function trimEntries(entries: Record<string, string>): { trimmed: Record<string, string>; count: number } {
  let count = 0;
  const trimmed: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    const trimmedValue = value.trim();
    if (trimmedValue !== value) count++;
    trimmed[key] = trimmedValue;
  }
  return { trimmed, count };
}

export function registerTrimCommand(program: Command): void {
  program
    .command('trim <vault>')
    .description('Remove leading/trailing whitespace from all values in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'show what would be trimmed without modifying the vault')
    .action(async (vaultPath: string, options: { password?: string; dryRun?: boolean }) => {
      try {
        const password = options.password ?? '';
        const vault = await openVault(vaultPath, password);
        const { trimmed, count } = trimEntries(vault.entries);

        if (count === 0) {
          console.log('No values needed trimming.');
          return;
        }

        if (options.dryRun) {
          for (const [key, value] of Object.entries(vault.entries)) {
            if (value !== trimmed[key]) {
              console.log(`  ${key}: ${JSON.stringify(value)} -> ${JSON.stringify(trimmed[key])}`);
            }
          }
          console.log(`\nDry run: ${count} value(s) would be trimmed.`);
          return;
        }

        vault.entries = trimmed;
        await writeVault(vaultPath, vault, password);
        console.log(`Trimmed ${count} value(s).`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
