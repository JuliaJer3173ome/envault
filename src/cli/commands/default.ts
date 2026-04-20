import { Command } from 'commander';
import * as fs from 'fs';
import { openVault } from '../../crypto/vault';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function getDefaultKey(entries: Record<string, string>): string | undefined {
  const common = ['DEFAULT', 'APP_ENV', 'NODE_ENV', 'ENVIRONMENT', 'ENV'];
  for (const key of common) {
    if (key in entries) return key;
  }
  const keys = Object.keys(entries);
  return keys.length > 0 ? keys[0] : undefined;
}

export function registerDefaultCommand(program: Command): void {
  program
    .command('default <vault>')
    .description('Show or set the default key in a vault')
    .option('-p, --password <password>', 'vault password')
    .option('-s, --set <key>', 'set a key as the default (prints its value prominently)')
    .action(async (vaultPath: string, opts) => {
      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }
      const password = opts.password ?? await promptPassword('Password: ');
      let entries: Record<string, string>;
      try {
        entries = await openVault(vaultPath, password);
      } catch {
        console.error('Failed to open vault. Wrong password?');
        process.exit(1);
      }
      if (opts.set) {
        if (!(opts.set in entries)) {
          console.error(`Key not found: ${opts.set}`);
          process.exit(1);
        }
        console.log(`Default key: ${opts.set}`);
        console.log(`Value: ${entries[opts.set]}`);
      } else {
        const key = getDefaultKey(entries);
        if (!key) {
          console.log('Vault is empty.');
        } else {
          console.log(`Default key: ${key}`);
          console.log(`Value: ${entries[key]}`);
        }
      }
    });
}
