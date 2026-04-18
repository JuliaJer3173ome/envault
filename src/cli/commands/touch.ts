import { Command } from 'commander';
import * as fs from 'fs';
import * as readline from 'readline';
import { createVault } from '../../crypto/vault';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerTouchCommand(program: Command): void {
  program
    .command('touch <vault>')
    .description('Create an empty vault file if it does not already exist')
    .option('-p, --password <password>', 'vault password')
    .action(async (vaultPath: string, options: { password?: string }) => {
      if (fs.existsSync(vaultPath)) {
        console.log(`Vault already exists: ${vaultPath}`);
        return;
      }

      const password = options.password ?? (await promptPassword('Password: '));

      try {
        await createVault(vaultPath, password);
        console.log(`Created empty vault: ${vaultPath}`);
      } catch (err) {
        console.error('Failed to create vault:', (err as Error).message);
        process.exit(1);
      }
    });
}
