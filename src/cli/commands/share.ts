import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { openVault, createVault } from '../../crypto';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function generateShareBundle(vaultPath: string, keys: string[], entries: Record<string, string>): object {
  const subset: Record<string, string> = {};
  for (const key of keys) {
    if (entries[key] !== undefined) subset[key] = entries[key];
  }
  return {
    source: path.basename(vaultPath),
    exportedAt: new Date().toISOString(),
    entries: subset,
  };
}

export function registerShareCommand(program: Command): void {
  program
    .command('share <vault> <output>')
    .description('Export a subset of vault entries to a shareable encrypted bundle')
    .option('-k, --keys <keys>', 'Comma-separated keys to share')
    .option('-p, --password <password>', 'Vault password')
    .option('-P, --share-password <sharePassword>', 'Password for the share bundle')
    .action(async (vault: string, output: string, opts) => {
      try {
        const password = opts.password || await promptPassword('Vault password: ');
        const entries = await openVault(vault, password);
        const keys: string[] = opts.keys ? opts.keys.split(',').map((k: string) => k.trim()) : Object.keys(entries);
        const bundle = generateShareBundle(vault, keys, entries);
        const sharePassword = opts.sharePassword || await promptPassword('Share bundle password: ');
        const bundleEntries = (bundle as any).entries as Record<string, string>;
        await createVault(output, sharePassword, bundleEntries);
        console.log(`Shared ${Object.keys(bundleEntries).length} key(s) to ${output}`);
      } catch (err: any) {
        console.error('Share failed:', err.message);
        process.exit(1);
      }
    });
}
