import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { readVault, writeVault, openVault } from '../../crypto/vault';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export async function cloneVault(
  sourcePath: string,
  destPath: string,
  password: string,
  newPassword?: string
): Promise<void> {
  const vault = readVault(sourcePath);
  const entries = await openVault(vault, password);
  const targetPassword = newPassword || password;

  const { createVault } = await import('../../crypto/vault');
  const newVault = await createVault(targetPassword);

  const { updateVault } = await import('../../crypto/vault');
  const updatedVault = await updateVault(newVault, targetPassword, entries);

  writeVault(destPath, updatedVault);
}

export function registerCloneCommand(program: Command): void {
  program
    .command('clone <source> <destination>')
    .description('Clone a vault to a new location, optionally with a new password')
    .option('-p, --password <password>', 'Source vault password')
    .option('-n, --new-password <newPassword>', 'New password for the cloned vault')
    .action(async (source: string, destination: string, options) => {
      try {
        const sourcePath = path.resolve(source);
        const destPath = path.resolve(destination);

        if (!fs.existsSync(sourcePath)) {
          console.error(`Source vault not found: ${sourcePath}`);
          process.exit(1);
        }
        if (fs.existsSync(destPath)) {
          console.error(`Destination already exists: ${destPath}`);
          process.exit(1);
        }

        const password = options.password || await promptPassword('Source vault password: ');
        const newPassword = options.newPassword || undefined;

        await cloneVault(sourcePath, destPath, password, newPassword);
        console.log(`Vault cloned to ${destPath}`);
      } catch (err: any) {
        console.error('Clone failed:', err.message);
        process.exit(1);
      }
    });
}
