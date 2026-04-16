import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { openVault } from '../../crypto';

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export interface CompareResult {
  onlyInA: string[];
  onlyInB: string[];
  diffValues: string[];
  common: string[];
}

export function compareVaults(
  entriesA: Record<string, string>,
  entriesB: Record<string, string>
): CompareResult {
  const keysA = new Set(Object.keys(entriesA));
  const keysB = new Set(Object.keys(entriesB));
  const onlyInA = [...keysA].filter((k) => !keysB.has(k));
  const onlyInB = [...keysB].filter((k) => !keysA.has(k));
  const diffValues: string[] = [];
  const common: string[] = [];
  for (const k of keysA) {
    if (keysB.has(k)) {
      if (entriesA[k] !== entriesB[k]) diffValues.push(k);
      else common.push(k);
    }
  }
  return { onlyInA, onlyInB, diffValues, common };
}

export function registerCompareCommand(program: Command): void {
  program
    .command('compare <vaultA> <vaultB>')
    .description('Compare two vaults and show key differences')
    .option('-p, --password <password>', 'password for both vaults')
    .action(async (vaultA: string, vaultB: string, opts) => {
      if (!fs.existsSync(vaultA)) { console.error(`Vault not found: ${vaultA}`); process.exit(1); }
      if (!fs.existsSync(vaultB)) { console.error(`Vault not found: ${vaultB}`); process.exit(1); }
      const password = opts.password ?? await promptPassword('Password: ');
      try {
        const a = await openVault(vaultA, password);
        const b = await openVault(vaultB, password);
        const result = compareVaults(a.entries, b.entries);
        if (result.onlyInA.length) console.log(`Only in ${vaultA}: ${result.onlyInA.join(', ')}`);
        if (result.onlyInB.length) console.log(`Only in ${vaultB}: ${result.onlyInB.join(', ')}`);
        if (result.diffValues.length) console.log(`Different values: ${result.diffValues.join(', ')}`);
        if (!result.onlyInA.length && !result.onlyInB.length && !result.diffValues.length) {
          console.log('Vaults are identical.');
        }
      } catch {
        console.error('Failed to open vaults. Check password or file paths.');
        process.exit(1);
      }
    });
}
