import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, updateVault, openVault } from '../../crypto/vault';
import { promptPassword } from './init';

export async function promptValue(key: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`Value for ${key}: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Validates that a key is non-empty and contains only allowed characters
 * (alphanumeric, underscores, hyphens, and dots).
 */
function validateKey(key: string): void {
  if (!key || key.trim().length === 0) {
    throw new Error('Key must not be empty.');
  }
  if (!/^[\w\-.]+$/.test(key)) {
    throw new Error(`Invalid key "${key}": only alphanumeric characters, underscores, hyphens, and dots are allowed.`);
  }
}

export function registerSetCommand(program: Command): void {
  program
    .command('set <key> [value]')
    .description('Set or update a key-value pair in the vault')
    .option('-f, --file <path>', 'Path to vault file', '.envault')
    .action(async (key: string, value: string | undefined, options: { file: string }) => {
      try {
        validateKey(key);

        const vaultData = await readVault(options.file);
        const password = await promptPassword('Enter vault password: ');
        const entries = await openVault(vaultData, password);

        const resolvedValue = value ?? (await promptValue(key));

        const updated = { ...entries, [key]: resolvedValue };
        await updateVault(options.file, vaultData, password, updated);

        console.log(`✔ Key "${key}" set successfully.`);
      } catch (err: any) {
        console.error(`✖ Failed to set key: ${err.message}`);
        process.exit(1);
      }
    });
}
