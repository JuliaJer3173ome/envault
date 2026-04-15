import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault } from '../../crypto';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function diffVaults(
  aEntries: Record<string, string>,
  bEntries: Record<string, string>
): { added: string[]; removed: string[]; changed: string[] } {
  const aKeys = new Set(Object.keys(aEntries));
  const bKeys = new Set(Object.keys(bEntries));

  const added = [...bKeys].filter((k) => !aKeys.has(k));
  const removed = [...aKeys].filter((k) => !bKeys.has(k));
  const changed = [...aKeys].filter((k) => bKeys.has(k) && aEntries[k] !== bEntries[k]);

  return { added, removed, changed };
}

export function registerDiffCommand(program: Command): void {
  program
    .command('diff <vaultA> <vaultB>')
    .description('Show differences between two vault files')
    .option('-p, --password <password>', 'Password for both vaults')
    .action(async (vaultA: string, vaultB: string, options: { password?: string }) => {
      if (!fs.existsSync(vaultA)) {
        console.error(`Vault not found: ${vaultA}`);
        process.exit(1);
      }
      if (!fs.existsSync(vaultB)) {
        console.error(`Vault not found: ${vaultB}`);
        process.exit(1);
      }

      const password = options.password ?? (await promptPassword('Enter vault password: '));

      try {
        const dataA = openVault(vaultA, password);
        const dataB = openVault(vaultB, password);
        const { added, removed, changed } = diffVaults(dataA, dataB);

        if (added.length === 0 && removed.length === 0 && changed.length === 0) {
          console.log('Vaults are identical.');
          return;
        }

        added.forEach((k) => console.log(`+ ${k}`));
        removed.forEach((k) => console.log(`- ${k}`));
        changed.forEach((k) => console.log(`~ ${k}`));
      } catch {
        console.error('Failed to open vaults. Check your password.');
        process.exit(1);
      }
    });
}
