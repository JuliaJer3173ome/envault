import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault, openVault } from '../../crypto/vault';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function changePassword(
  vaultPath: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const vault = await readVault(vaultPath);
  const entries = await openVault(vault, oldPassword);
  const { createVault } = await import('../../crypto/vault');
  const newVault = await createVault(entries, newPassword);
  await writeVault(vaultPath, newVault);
}

export function registerPasswdCommand(program: Command): void {
  program
    .command('passwd <vault>')
    .description('Change the master password of a vault')
    .action(async (vaultPath: string) => {
      try {
        const oldPassword = await promptPassword('Current password: ');
        const newPassword = await promptPassword('New password: ');
        const confirmPassword = await promptPassword('Confirm new password: ');

        if (newPassword !== confirmPassword) {
          console.error('Error: New passwords do not match.');
          process.exit(1);
        }

        if (newPassword.length < 8) {
          console.error('Error: Password must be at least 8 characters.');
          process.exit(1);
        }

        await changePassword(vaultPath, oldPassword, newPassword);
        console.log('Password changed successfully.');
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
