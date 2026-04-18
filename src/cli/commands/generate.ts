import { Command } from 'commander';
import * as readline from 'readline';
import { openVault, updateVault } from '../../crypto/vault';

const CHARSET_ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARSET_NUMERIC = '0123456789';
const CHARSET_SPECIAL = '!@#$%^&*()-_=+[]{}|;:,.<>?';

export function generatePassword(length: number, options: { alpha: boolean; numeric: boolean; special: boolean }): string {
  let charset = '';
  if (options.alpha) charset += CHARSET_ALPHA;
  if (options.numeric) charset += CHARSET_NUMERIC;
  if (options.special) charset += CHARSET_SPECIAL;
  if (!charset) charset = CHARSET_ALPHA + CHARSET_NUMERIC;

  return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
}

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerGenerateCommand(program: Command): void {
  program
    .command('generate <vault> <key>')
    .description('Generate a random value for a key in the vault')
    .option('-l, --length <number>', 'Length of generated value', '32')
    .option('--no-alpha', 'Exclude alphabetic characters')
    .option('--no-numeric', 'Exclude numeric characters')
    .option('--special', 'Include special characters', false)
    .option('-p, --password <password>', 'Vault password')
    .action(async (vaultPath: string, key: string, opts) => {
      try {
        const password = opts.password ?? await promptPassword('Enter vault password: ');
        const length = parseInt(opts.length, 10);
        if (isNaN(length) || length < 1) {
          console.error('Invalid length');
          process.exit(1);
        }
        const value = generatePassword(length, {
          alpha: opts.alpha !== false,
          numeric: opts.numeric !== false,
          special: !!opts.special,
        });
        const vault = await openVault(vaultPath, password);
        vault[key] = value;
        await updateVault(vaultPath, password, vault);
        console.log(`Generated value for "${key}": ${value}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
