import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function flattenEntries(entries: Record<string, string>, prefix: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    const newKey = prefix ? `${prefix}_${key}` : key;
    result[newKey.toUpperCase()] = value;
  }
  return result;
}

export function registerFlattenCommand(program: Command): void {
  program
    .command('flatten <vault>')
    .description('Flatten all keys in a vault by applying an optional prefix and uppercasing')
    .option('-p, --prefix <prefix>', 'Prefix to prepend to all keys', '')
    .option('--password <password>', 'Vault password')
    .option('--dry-run', 'Preview changes without writing')
    .action(async (vaultPath: string, options) => {
      try {
        const password = options.password || await promptPassword('Enter vault password: ');
        const vault = await openVault(vaultPath, password);
        const flattened = flattenEntries(vault.entries, options.prefix);

        if (options.dryRun) {
          console.log('Dry run — proposed keys:');
          for (const key of Object.keys(flattened)) {
            console.log(`  ${key}`);
          }
          return;
        }

        vault.entries = flattened;
        await writeVault(vaultPath, vault);
        console.log(`Flattened ${Object.keys(flattened).length} keys in ${vaultPath}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
