import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault, openVault, updateVault } from '../../crypto/vault';
import { deriveKey } from '../../crypto/encryption';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerRotateCommand(program: Command): void {
  program
    .command('rotate')
    .description('Re-encrypt the vault with a new password')
    .option('-f, --file <path>', 'Path to the vault file', '.envault')
    .action(async (options) => {
      try {
        const currentPassword = await promptPassword('Current password: ');
        const vault = await readVault(options.file);
        const entries = await openVault(vault, currentPassword);

        const newPassword = await promptPassword('New password: ');
        const confirmPassword = await promptPassword('Confirm new password: ');

        if (newPassword !== confirmPassword) {
          console.error('Error: Passwords do not match.');
          process.exit(1);
        }

        if (newPassword.length < 8) {
          console.error('Error: Password must be at least 8 characters.');
          process.exit(1);
        }

        const newKey = await deriveKey(newPassword, vault.salt);
        let updatedVault = vault;
        for (const [key, value] of Object.entries(entries)) {
          updatedVault = await updateVault(updatedVault, newPassword, key, value);
        }

        await writeVault(options.file, updatedVault);
        console.log('Vault password rotated successfully.');
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
