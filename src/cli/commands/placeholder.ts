import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function applyPlaceholders(entries: Record<string, string>, vars: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(entries)) {
    result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? `{{${name}}}`);
  }
  return result;
}

export function registerPlaceholderCommand(program: Command): void {
  program
    .command('placeholder <vault> <key=value...>')
    .description('Replace {{VAR}} placeholders in vault values with provided variables')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'preview replacements without saving')
    .action(async (vaultPath: string, assignments: string[], opts) => {
      try {
        const password = opts.password ?? await promptPassword('Password: ');
        const vault = await openVault(vaultPath, password);
        const vars: Record<string, string> = {};
        for (const a of assignments) {
          const idx = a.indexOf('=');
          if (idx === -1) { console.error(`Invalid assignment: ${a}`); process.exit(1); }
          vars[a.slice(0, idx)] = a.slice(idx + 1);
        }
        const updated = applyPlaceholders(vault.entries, vars);
        if (opts.dryRun) {
          for (const [k, v] of Object.entries(updated)) console.log(`${k}=${v}`);
        } else {
          vault.entries = updated;
          await writeVault(vaultPath, vault);
          console.log('Placeholders applied.');
        }
      } catch (e: any) {
        console.error(e.message); process.exit(1);
      }
    });
}
