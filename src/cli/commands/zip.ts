import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function zipEntries(
  entriesA: Record<string, string>,
  entriesB: Record<string, string>
): Record<string, string> {
  const keysA = Object.keys(entriesA);
  const keysB = Object.keys(entriesB);
  const maxLen = Math.max(keysA.length, keysB.length);
  const result: Record<string, string> = {};

  for (let i = 0; i < maxLen; i++) {
    if (i < keysA.length) {
      const k = keysA[i];
      result[k] = entriesA[k];
    }
    if (i < keysB.length) {
      const k = keysB[i];
      result[k] = entriesB[k];
    }
  }

  return result;
}

export function registerZipCommand(program: Command): void {
  program
    .command('zip <vaultA> <vaultB> <output>')
    .description('Interleave entries from two vaults into a new vault')
    .option('-p, --password <password>', 'Vault password')
    .action(async (vaultA: string, vaultB: string, output: string, opts) => {
      try {
        const password = opts.password ?? (await promptPassword('Password: '));

        const pathA = path.resolve(vaultA);
        const pathB = path.resolve(vaultB);
        const outPath = path.resolve(output);

        const entriesA = await openVault(pathA, password);
        const entriesB = await openVault(pathB, password);

        const zipped = zipEntries(entriesA, entriesB);

        await writeVault(outPath, zipped, password);
        console.log(`Zipped ${Object.keys(zipped).length} entries into ${outPath}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
