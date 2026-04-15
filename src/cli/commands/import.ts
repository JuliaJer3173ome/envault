import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { openVault, updateVault } from '../../crypto/vault';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.stdoutMuted = true;
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    (rl as any)._writeToOutput = (str: string) => {
      if (str.trim()) (rl as any).output.write('*');
    };
  });
}

function parseEnvFile(content: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) entries[key] = value;
  }
  return entries;
}

export function registerImportCommand(program: Command): void {
  program
    .command('import <envfile>')
    .description('Import variables from a .env file into the vault')
    .option('-v, --vault <path>', 'path to vault file', '.envault')
    .option('-p, --password <password>', 'vault password')
    .action(async (envfile: string, options: { vault: string; password?: string }) => {
      const envFilePath = path.resolve(envfile);
      if (!fs.existsSync(envFilePath)) {
        console.error(`Error: File not found: ${envFilePath}`);
        process.exit(1);
      }

      const password = options.password ?? await promptPassword('Enter vault password: ');

      try {
        const content = fs.readFileSync(envFilePath, 'utf-8');
        const entries = parseEnvFile(content);
        const keys = Object.keys(entries);

        if (keys.length === 0) {
          console.log('No variables found in the provided .env file.');
          return;
        }

        const vault = await openVault(options.vault, password);
        for (const [key, value] of Object.entries(entries)) {
          vault[key] = value;
        }
        await updateVault(options.vault, password, vault);

        console.log(`Successfully imported ${keys.length} variable(s): ${keys.join(', ')}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
