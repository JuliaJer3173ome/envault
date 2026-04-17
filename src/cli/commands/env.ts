import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { openVault } from '../../crypto';
import { isLocked } from './lock';
import { resolveAlias } from './pin';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function buildEnvString(entries: Record<string, string>, keys?: string[]): string {
  const target = keys ? Object.fromEntries(Object.entries(entries).filter(([k]) => keys.includes(k))) : entries;
  return Object.entries(target).map(([k, v]) => `${k}=${v}`).join('\n');
}

export function registerEnvCommand(program: Command): void {
  program
    .command('env <vault>')
    .description('Print vault entries as KEY=VALUE pairs suitable for eval or sourcing')
    .option('-p, --password <password>', 'vault password')
    .option('-k, --keys <keys>', 'comma-separated list of keys to include')
    .option('--export', 'prefix each line with export')
    .action(async (vault: string, opts) => {
      const vaultPath = resolveAlias(vault) ?? vault;
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }
      if (isLocked(vaultPath)) {
        console.error('Vault is locked.');
        process.exit(1);
      }
      const password = opts.password ?? await promptPassword('Password: ');
      try {
        const entries = await openVault(vaultPath, password);
        const keys = opts.keys ? opts.keys.split(',').map((k: string) => k.trim()) : undefined;
        const lines = buildEnvString(entries, keys)
          .split('\n')
          .filter(Boolean)
          .map((line: string) => opts.export ? `export ${line}` : line);
        console.log(lines.join('\n'));
      } catch {
        console.error('Failed to open vault. Wrong password?');
        process.exit(1);
      }
    });
}
