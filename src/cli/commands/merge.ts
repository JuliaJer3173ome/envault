import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault, writeVault } from '../../crypto/vault';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function mergeVaults(
  target: Record<string, string>,
  source: Record<string, string>,
  overwrite: boolean
): { merged: Record<string, string>; added: string[]; skipped: string[] } {
  const merged = { ...target };
  const added: string[] = [];
  const skipped: string[] = [];

  for (const [key, value] of Object.entries(source)) {
    if (key in merged && !overwrite) {
      skipped.push(key);
    } else {
      if (!(key in merged)) added.push(key);
      merged[key] = value;
    }
  }

  return { merged, added, skipped };
}

export function registerMergeCommand(program: Command): void {
  program
    .command('merge <source>')
    .description('Merge entries from another vault file into the current vault')
    .option('-p, --password <password>', 'vault password')
    .option('--source-password <password>', 'source vault password')
    .option('--overwrite', 'overwrite existing keys', false)
    .option('-v, --vault <path>', 'path to vault file', '.envault')
    .action(async (source: string, options) => {
      try {
        if (!fs.existsSync(options.vault)) {
          console.error(`Error: vault file not found at ${options.vault}`);
          process.exit(1);
        }
        if (!fs.existsSync(source)) {
          console.error(`Error: source vault file not found at ${source}`);
          process.exit(1);
        }

        const password = options.password ?? await promptPassword('Enter target vault password: ');
        const sourcePassword = options.sourcePassword ?? await promptPassword('Enter source vault password: ');

        const targetEntries = await openVault(options.vault, password);
        const sourceEntries = await openVault(source, sourcePassword);

        const { merged, added, skipped } = mergeVaults(targetEntries, sourceEntries, options.overwrite);

        await writeVault(options.vault, password, merged);

        console.log(`Merged ${added.length} new key(s) into vault.`);
        if (added.length > 0) console.log(`  Added: ${added.join(', ')}`);
        if (skipped.length > 0) console.log(`  Skipped (already exist): ${skipped.join(', ')}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
