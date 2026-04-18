import { Command } from 'commander';
import * as readline from 'readline';
import { openVault, updateVault } from '../../crypto/vault';

const CHARSETS: Record<string, string> = {
  alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numeric: '0123456789',
  alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  special: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}',
};

export function generateRandom(length: number, charset: string): string {
  const chars = CHARSETS[charset] ?? CHARSETS['special'];
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerRandomizeCommand(program: Command): void {
  program
    .command('randomize <vault> <key>')
    .description('Generate and set a random value for a key in the vault')
    .option('-l, --length <number>', 'Length of generated value', '32')
    .option('-c, --charset <type>', 'Character set: alpha, numeric, alphanumeric, special', 'special')
    .option('-p, --password <password>', 'Vault password')
    .action(async (vaultPath: string, key: string, opts) => {
      try {
        const password = opts.password ?? await promptPassword('Password: ');
        const length = parseInt(opts.length, 10);
        if (isNaN(length) || length < 1) {
          console.error('Error: length must be a positive integer');
          process.exit(1);
        }
        const value = generateRandom(length, opts.charset);
        const vault = await openVault(vaultPath, password);
        vault.entries[key] = value;
        await updateVault(vaultPath, password, vault.entries);
        console.log(`Set ${key} to a random ${opts.charset} value of length ${length}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
